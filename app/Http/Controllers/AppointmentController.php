<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AppointmentController extends Controller
{
    public function createAppointment(Request $request)
    {
        // Валидация входящих данных
        $validated = $request->validate([
            'user_id' => 'required|integer',
            'doctor_id' => 'required|integer',
            'time' => 'required|date',
            'timeplus' => 'required|date|after:time',
            'services' => 'required|array',
            'services.*' => 'integer',
        ]);

        // Подготовка данных для внешнего API
        $startDateTime = date('Y-m-d H:i:s', strtotime($validated['time']));
        $finishDateTime = date('Y-m-d H:i:s', strtotime($validated['timeplus']));
        $startDate = date('Y-m-d', strtotime($validated['time']));
        $startTime = date('H:i:s', strtotime($validated['time']));
        $finishDate = date('Y-m-d', strtotime($validated['timeplus']));
        $finishTime = date('H:i:s', strtotime($validated['timeplus']));
        $servicesString = implode(',', $validated['services']);

        // Данные для внешнего API
        $apiUrl = 'https://klientiks.ru/clientix/restapi/add/a/61ce3c58eaf0/u/edd7a5545a63/t/1fa5b4b0d9f4dcb850f58e7c460501f1/m/Appointments';
        $token = '1fa5b4b0d9f4dcb850f58e7c460501f1';

        $postData = [
            'client_id' => $validated['user_id'],
            'executor_id' => $validated['doctor_id'],
            'status' => 'scheduled',
            'start_datetime' => $startDate,
            'start_time' => $startTime,
            'finish_datetime' => $finishDate,
            'finish_time' => $finishTime,
            'appointed_services' => $servicesString,
        ];

        // Отправка запроса на внешний API
        $response = Http::withHeaders([
            'Authorization' => 'Bearer ' . $token,
            'Content-Type' => 'application/x-www-form-urlencoded',
        ])->post($apiUrl, $postData);

        // Возврат ответа от внешнего API
        return response()->json($response->json(), $response->status());
    }
}