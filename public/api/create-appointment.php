<?php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Получение JSON данных
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

// Валидация данных
$requiredFields = ['user_id', 'doctor_id', 'time', 'timeplus'];
foreach ($requiredFields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => "Missing required field: $field"]);
        exit;
    }
}

// Проверяем services если передан
if (isset($data['services'])) {
    if (!is_array($data['services']) || empty($data['services'])) {
        http_response_code(400);
        echo json_encode(['error' => "Services must be a non-empty array"]);
        exit;
    }
}


// Подготовка данных для внешнего API
$startDate = date('Y-m-d', strtotime($data['time']));
$startTime = date('H:i:s', strtotime($data['time']));
$finishDate = date('Y-m-d', strtotime($data['timeplus']));
$finishTime = date('H:i:s', strtotime($data['timeplus']));
$servicesString = isset($data['services']) ? implode(',', $data['services']) : '';

$apiUrl = 'https://klientiks.ru/clientix/restapi/add/a/61ce3c58eaf0/u/edd7a5545a63/t/1fa5b4b0d9f4dcb850f58e7c460501f1/m/Appointments';
$token = '1fa5b4b0d9f4dcb850f58e7c460501f1';

$postData = http_build_query([
    'client_id' => $data['user_id'],
    'executor_id' => $data['doctor_id'],
    'status' => 'scheduled',
    'start_datetime' => $startDate,
    'start_time' => $startTime,
    'finish_datetime' => $finishDate,
    'finish_time' => $finishTime,
    'appointed_services' => $servicesString,
]);

$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            "Authorization: Bearer $token",
            "Content-Type: application/x-www-form-urlencoded",
            "Content-Length: " . strlen($postData)
        ],
        'content' => $postData,
    ],
    'ssl' => [
        'verify_peer' => false,
        'verify_peer_name' => false,
        'allow_self_signed' => true,
    ],
]);

$response = file_get_contents($apiUrl, false, $context);

if ($response === false) {
    $error = error_get_last();
    http_response_code(500);
    echo json_encode([
        'error' => 'Failed to connect to external API',
        'details' => $error ? $error['message'] : 'Unknown error'
    ]);
    exit;
}

// Проверяем HTTP код ответа
$responseCode = 200;
if (isset($http_response_header)) {
    foreach ($http_response_header as $header) {
        if (preg_match('/^HTTP\/\d\.\d\s+(\d+)/', $header, $matches)) {
            $responseCode = intval($matches[1]);
            break;
        }
    }
}

// Парсим ответ от внешнего API
$responseData = json_decode($response, true);

// Если внешний API вернул ошибку, передаем её клиенту
if ($responseCode >= 400) {
    http_response_code($responseCode);
    echo json_encode([
        'success' => false,
        'error' => 'External API error',
        'details' => $responseData ? $responseData : $response,
        'http_code' => $responseCode
    ]);
    exit;
}

// Проверяем успешность создания записи
if ($responseData && isset($responseData['status']) && $responseData['status'] === true) {
    // Проверяем есть ли ошибки в ответе
    if (isset($responseData['errors']) && !empty($responseData['errors'])) {
        // Есть ошибки - запись не создана
        // Извлекаем причину из ошибок
        $reasons = [];
        foreach ($responseData['errors'] as $field => $messages) {
            if (is_array($messages)) {
                $reasons = array_merge($reasons, $messages);
            } else {
                $reasons[] = $messages;
            }
        }
        $reason = implode('. ', $reasons);
        
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create appointment',
            'reason' => $reason,
            'details' => $responseData['errors'],
            'message' => 'Appointment creation failed: ' . $reason
        ]);
    } else {
        // Успешное создание без ошибок
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Appointment created successfully',
            'appointment_id' => $responseData['object']['id'] ?? null,
            'data' => $responseData
        ]);
    }
} else {
    // Ошибка создания
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to create appointment',
        'reason' => 'Unknown error from external API',
        'details' => $responseData ? $responseData : $response
    ]);
}