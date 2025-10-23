<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppointmentController;

Route::post('/api/create-appointment', [AppointmentController::class, 'createAppointment']);