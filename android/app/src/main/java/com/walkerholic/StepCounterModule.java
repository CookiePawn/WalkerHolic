package com.walkerholic;

import android.content.Intent;
import android.content.Context;
import android.os.Build;
import android.util.Log;
import android.content.SharedPreferences;
import java.util.Calendar;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class StepCounterModule extends ReactContextBaseJavaModule {
    private static final String TAG = "StepCounterModule";
    private static final String PREFS_NAME = "StepCounterPrefs";
    private final ReactApplicationContext reactContext;
    private StepCounterService stepCounterService;

    public StepCounterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @Override
    public String getName() {
        return "StepCounter";
    }

    // Required for event emitter
    @ReactMethod
    public void addListener(String eventName) {
        // Keep: Required for RN built in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Keep: Required for RN built in Event Emitter
    }

    @ReactMethod
    public void startStepCounter(Promise promise) {
        try {
            Context context = reactContext.getApplicationContext();
            Intent serviceIntent = new Intent(context, StepCounterService.class);
            
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
            
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error starting step counter service", e);
            promise.reject("ERROR", "Failed to start step counter service: " + e.getMessage());
        }
    }

    @ReactMethod
    public void stopStepCounter(Promise promise) {
        try {
            Context context = reactContext.getApplicationContext();
            Intent serviceIntent = new Intent(context, StepCounterService.class);
            context.stopService(serviceIntent);
            promise.resolve(true);
        } catch (Exception e) {
            Log.e(TAG, "Error stopping step counter service", e);
            promise.reject("ERROR", "Failed to stop step counter service: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getTodaySteps(Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String today = getCurrentDate();
            
            float lastSteps = prefs.getFloat(today + "_lastSteps", 0);
            float totalSteps = prefs.getFloat(today + "_totalSteps", 0);
            float todaySteps = totalSteps - lastSteps;
            
            if (todaySteps < 0) todaySteps = 0;
            
            WritableMap result = Arguments.createMap();
            result.putDouble("steps", todaySteps);
            result.putString("date", today);
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting today's steps", e);
            promise.reject("ERROR", "Failed to get today's steps: " + e.getMessage());
        }
    }

    @ReactMethod
    public void getDailySteps(String date, Promise promise) {
        try {
            SharedPreferences prefs = reactContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            float steps = prefs.getFloat(date + "_dailySteps", 0);
            
            WritableMap result = Arguments.createMap();
            result.putDouble("steps", steps);
            result.putString("date", date);
            
            promise.resolve(result);
        } catch (Exception e) {
            Log.e(TAG, "Error getting daily steps", e);
            promise.reject("ERROR", "Failed to get daily steps: " + e.getMessage());
        }
    }

    private String getCurrentDate() {
        Calendar calendar = Calendar.getInstance();
        return String.format("%d-%02d-%02d",
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH) + 1,
            calendar.get(Calendar.DAY_OF_MONTH));
    }

    public void setStepCounterService(StepCounterService service) {
        this.stepCounterService = service;
        if (service != null) {
            service.setReactContext(reactContext);
        }
    }
} 