package com.walkerholic;

import android.content.Context;
import android.content.pm.PackageManager;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.Manifest;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

public class StepCounterModule extends ReactContextBaseJavaModule implements SensorEventListener {
    private final ReactApplicationContext reactContext;
    private SensorManager sensorManager;
    private Sensor stepCounter;
    private float steps = 0;
    private float lastSteps = 0;
    private static final String TAG = "StepCounterModule";

    public StepCounterModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
        this.sensorManager = (SensorManager) reactContext.getSystemService(Context.SENSOR_SERVICE);
        this.stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        if (stepCounter != null) {
            Log.d(TAG, "Step counter sensor found: " + stepCounter.getName());
        } else {
            Log.e(TAG, "Step counter sensor not available");
        }
    }

    @Override
    public String getName() {
        return "StepCounter";
    }

    private boolean checkPermissions() {
        return reactContext.checkSelfPermission(Manifest.permission.BODY_SENSORS) == PackageManager.PERMISSION_GRANTED &&
               reactContext.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION) == PackageManager.PERMISSION_GRANTED;
    }

    private void sendEvent(String eventName, WritableMap params) {
        ReactContext reactContext = getReactApplicationContext();
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @ReactMethod
    public void addListener(String eventName) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    public void removeListeners(Integer count) {
        // Required for RN built in Event Emitter
    }

    @ReactMethod
    public void startStepCounter(Promise promise) {
        if (stepCounter == null) {
            Log.e(TAG, "Step counter sensor not available");
            promise.reject("ERROR", "Step counter sensor not available");
            return;
        }

        if (!checkPermissions()) {
            Log.e(TAG, "Required permissions not granted");
            promise.reject("ERROR", "Required permissions not granted");
            return;
        }

        boolean registered = sensorManager.registerListener(this, stepCounter, SensorManager.SENSOR_DELAY_NORMAL);
        if (registered) {
            Log.d(TAG, "Step counter sensor registered successfully");
            promise.resolve(null);
        } else {
            Log.e(TAG, "Failed to register step counter sensor");
            promise.reject("ERROR", "Failed to register step counter sensor");
        }
    }

    @ReactMethod
    public void stopStepCounter(Promise promise) {
        sensorManager.unregisterListener(this);
        Log.d(TAG, "Step counter sensor unregistered");
        promise.resolve(null);
    }

    @ReactMethod
    public void getSteps(Promise promise) {
        WritableMap map = Arguments.createMap();
        map.putDouble("steps", steps);
        Log.d(TAG, "Current steps: " + steps);
        promise.resolve(map);
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            steps = event.values[0];
            float stepDifference = steps - lastSteps;
            lastSteps = steps;

            Log.d(TAG, "Step counter updated - Total: " + steps + ", Difference: " + stepDifference);

            WritableMap params = Arguments.createMap();
            params.putDouble("steps", stepDifference);
            params.putDouble("totalSteps", steps);

            sendEvent("stepCounterUpdate", params);
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }
} 