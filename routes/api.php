<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AppointmentController;

Route::post('/create-appointment', [AppointmentController::class, 'createAppointment']);