package com.walkerholic;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.util.Log;
import android.content.Context;
import android.graphics.Color;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.content.SharedPreferences;
import java.util.Calendar;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.bridge.ReactContext;

public class StepCounterService extends Service implements SensorEventListener {
    private static final String TAG = "StepCounterService";
    private static final int NOTIFICATION_ID = 1;
    private static final String CHANNEL_ID = "StepCounterChannel";
    private static final String PREFS_NAME = "StepCounterPrefs";
    
    private PowerManager.WakeLock wakeLock;
    private SensorManager sensorManager;
    private Sensor stepCounter;
    private float totalSteps = 0;
    private float lastSteps = 0;
    private String currentDate;
    private NotificationManager notificationManager;
    private SharedPreferences prefs;
    private ReactContext reactContext;

    public void setReactContext(ReactContext reactContext) {
        this.reactContext = reactContext;
    }

    private String getCurrentDate() {
        Calendar calendar = Calendar.getInstance();
        return String.format("%d-%02d-%02d",
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH) + 1,
            calendar.get(Calendar.DAY_OF_MONTH));
    }

    private void sendEvent(String eventName, WritableMap params) {
        if (reactContext != null && reactContext.hasActiveReactInstance()) {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                .emit(eventName, params);
        }
    }

    @Override
    public void onCreate() {
        super.onCreate();
        Log.d(TAG, "Service created");
        
        // Initialize SharedPreferences
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        
        // Initialize current date and load last steps
        currentDate = getCurrentDate();
        lastSteps = prefs.getFloat(currentDate + "_lastSteps", 0);
        totalSteps = prefs.getFloat(currentDate + "_totalSteps", 0);
        
        // Initialize sensor manager and step counter
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);
        stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        
        // Initialize notification manager
        notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        
        // Acquire wake lock
        PowerManager powerManager = (PowerManager) getSystemService(Context.POWER_SERVICE);
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "WalkerHolic::StepCounterWakeLock"
        );
        wakeLock.acquire();

        // Create notification channel for Android O and above
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Step Counter Service",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Step counter service notification");
            channel.enableLights(true);
            channel.setLightColor(Color.BLUE);
            channel.enableVibration(true);
            channel.setShowBadge(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            notificationManager.createNotificationChannel(channel);
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        notificationIntent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        
        PendingIntent pendingIntent;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT
            );
        } else {
            pendingIntent = PendingIntent.getActivity(
                this,
                0,
                notificationIntent,
                PendingIntent.FLAG_UPDATE_CURRENT
            );
        }

        int todaySteps = (int)(totalSteps - lastSteps);
        if (todaySteps < 0) todaySteps = 0;

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(this, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(this);
        }

        return builder
            .setContentTitle("WalkerHolic")
            .setContentText(String.format("오늘의 걸음 수: %,d 걸음", todaySteps))
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(Notification.PRIORITY_HIGH)
            .setCategory(Notification.CATEGORY_SERVICE)
            .setVisibility(Notification.VISIBILITY_PUBLIC)
            .build();
    }

    private void updateNotification() {
        Notification notification = createNotification();
        notificationManager.notify(NOTIFICATION_ID, notification);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        Log.d(TAG, "Service started");
        
        // Register step counter sensor
        if (stepCounter != null) {
            sensorManager.registerListener(this, stepCounter, SensorManager.SENSOR_DELAY_NORMAL);
        }
        
        // Start foreground with initial notification
        startForeground(NOTIFICATION_ID, createNotification());

        return START_STICKY;
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        if (event.sensor.getType() == Sensor.TYPE_STEP_COUNTER) {
            float newTotalSteps = event.values[0];
            String today = getCurrentDate();
            
            // 날짜가 바뀌었는지 확인
            if (!today.equals(currentDate)) {
                // 이전 날짜의 데이터 저장
                saveDailySteps(currentDate, totalSteps - lastSteps);
                // 새로운 날짜 초기화
                currentDate = today;
                lastSteps = newTotalSteps;
                totalSteps = newTotalSteps;
            } else {
                totalSteps = newTotalSteps;
            }
            
            float todaySteps = totalSteps - lastSteps;
            if (todaySteps < 0) todaySteps = 0;
            
            // 현재 걸음 수 저장
            prefs.edit()
                .putFloat(currentDate + "_lastSteps", lastSteps)
                .putFloat(currentDate + "_totalSteps", totalSteps)
                .apply();
            
            // React Native로 데이터 전송
            WritableMap params = Arguments.createMap();
            params.putDouble("todaySteps", todaySteps);
            params.putDouble("totalSteps", totalSteps);
            params.putString("date", currentDate);
            sendEvent("stepCounterUpdate", params);
            
            // 알림 업데이트
            updateNotification();
        }
    }

    private void saveDailySteps(String date, float steps) {
        prefs.edit().putFloat(date + "_dailySteps", steps).apply();
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
        Log.d(TAG, "Sensor accuracy changed: " + accuracy);
    }

    @Override
    public void onTaskRemoved(Intent rootIntent) {
        super.onTaskRemoved(rootIntent);
        Log.d(TAG, "Task removed, restarting service");
        Intent restartService = new Intent(getApplicationContext(), StepCounterService.class);
        restartService.setPackage(getPackageName());
        startService(restartService);
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        Log.d(TAG, "Service destroyed");
        if (wakeLock != null && wakeLock.isHeld()) {
            wakeLock.release();
        }
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
        
        // Save current steps before destroying
        prefs.edit()
            .putFloat(currentDate + "_lastSteps", lastSteps)
            .putFloat(currentDate + "_totalSteps", totalSteps)
            .apply();
        
        // Restart service if it was destroyed
        Intent restartService = new Intent(getApplicationContext(), StepCounterService.class);
        restartService.setPackage(getPackageName());
        startService(restartService);
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
} 