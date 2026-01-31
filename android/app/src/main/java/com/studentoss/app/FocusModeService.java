package com.studentoss.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;

import androidx.core.app.NotificationCompat;

import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

/**
 * FocusModeService - Background service for monitoring and blocking apps
 * 
 * This service runs in the foreground to continuously monitor which app
 * is currently in use. If a blocked app is detected, it launches the
 * StudentOss app with the blocking overlay.
 * 
 * IMPORTANT: This is a template. Complete the implementation after
 * exporting from Lovable.
 * 
 * Key Features:
 * - Runs as a foreground service (required for background execution)
 * - Checks foreground app every 500ms using UsageStatsManager
 * - Launches blocking overlay when blocked app is detected
 * - Auto-stops when duration expires
 */
public class FocusModeService extends Service {

    private static final String CHANNEL_ID = "focus_mode_channel";
    private static final int NOTIFICATION_ID = 1001;
    private static final int CHECK_INTERVAL_MS = 500;

    private Handler handler;
    private Runnable checkRunnable;
    private List<String> blockedPackages = new ArrayList<>();
    private long endTime = 0;
    private boolean isRunning = false;

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
        handler = new Handler(Looper.getMainLooper());
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent != null) {
            ArrayList<String> packages = intent.getStringArrayListExtra("packages");
            int duration = intent.getIntExtra("duration", 1500);
            
            if (packages != null) {
                blockedPackages = packages;
            }
            
            endTime = System.currentTimeMillis() + (duration * 1000L);
        }

        // Start as foreground service
        startForeground(NOTIFICATION_ID, createNotification());
        
        // Start monitoring
        startMonitoring();

        return START_STICKY;
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        stopMonitoring();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Focus Mode",
                NotificationManager.IMPORTANCE_LOW
            );
            channel.setDescription("Focus mode is active - blocking distracting apps");
            
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(channel);
            }
        }
    }

    private Notification createNotification() {
        Intent notificationIntent = new Intent(this, MainActivity.class);
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, notificationIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Focus Mode Active")
            .setContentText("Blocking " + blockedPackages.size() + " distracting apps")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build();
    }

    private void startMonitoring() {
        if (isRunning) return;
        isRunning = true;

        checkRunnable = new Runnable() {
            @Override
            public void run() {
                if (!isRunning) return;

                // Check if time is up
                if (System.currentTimeMillis() >= endTime) {
                    stopSelf();
                    return;
                }

                // Check current foreground app
                String currentApp = getForegroundApp();
                if (currentApp != null && blockedPackages.contains(currentApp)) {
                    // Blocked app detected! Launch our app
                    launchBlockingOverlay();
                }

                // Schedule next check
                handler.postDelayed(this, CHECK_INTERVAL_MS);
            }
        };

        handler.post(checkRunnable);
    }

    private void stopMonitoring() {
        isRunning = false;
        if (handler != null && checkRunnable != null) {
            handler.removeCallbacks(checkRunnable);
        }
    }

    private String getForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        List<UsageStats> stats = usm.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            time - 1000 * 10,
            time
        );

        if (stats != null && !stats.isEmpty()) {
            SortedMap<Long, UsageStats> sortedMap = new TreeMap<>();
            for (UsageStats usageStats : stats) {
                sortedMap.put(usageStats.getLastTimeUsed(), usageStats);
            }
            if (!sortedMap.isEmpty()) {
                return sortedMap.get(sortedMap.lastKey()).getPackageName();
            }
        }
        return null;
    }

    private void launchBlockingOverlay() {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        // Add extra to navigate to blocking overlay
        intent.putExtra("route", "/blocking-overlay");
        startActivity(intent);
    }
}
