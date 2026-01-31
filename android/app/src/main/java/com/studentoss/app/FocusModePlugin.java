package com.studentoss.app;

import android.app.Activity;
import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.provider.Settings;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.SortedMap;
import java.util.TreeMap;

/**
 * FocusModePlugin - Capacitor plugin for Android app blocking
 * 
 * This plugin provides:
 * - Permission checking and requesting for Usage Stats and Overlay
 * - Listing installed apps on the device
 * - Starting/stopping app blocking via a background service
 * - Kiosk mode to lock users within the app
 * 
 * IMPORTANT: This is a template. You must complete the implementation
 * after exporting from Lovable and opening in Android Studio.
 * 
 * Required setup:
 * 1. Add permissions to AndroidManifest.xml
 * 2. Register this plugin in MainActivity
 * 3. Implement FocusModeService for background blocking
 */
@CapacitorPlugin(name = "FocusMode")
public class FocusModePlugin extends Plugin {

    private static final int REQUEST_USAGE_STATS = 1001;
    private static final int REQUEST_OVERLAY = 1002;

    private boolean isBlocking = false;
    private List<String> blockedPackages = new ArrayList<>();
    private long blockingStartTime = 0;
    private int blockingDuration = 0;

    /**
     * Check if required permissions are granted
     */
    @PluginMethod
    public void checkPermissions(PluginCall call) {
        JSObject result = new JSObject();
        result.put("usageStats", hasUsageStatsPermission());
        result.put("overlay", hasOverlayPermission());
        result.put("all", hasUsageStatsPermission() && hasOverlayPermission());
        call.resolve(result);
    }

    /**
     * Request permissions from the user
     * Opens system settings for the user to grant permission
     */
    @PluginMethod
    public void requestPermissions(PluginCall call) {
        String type = call.getString("type", "all");
        
        if (type.equals("usageStats") || type.equals("all")) {
            if (!hasUsageStatsPermission()) {
                Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                getActivity().startActivityForResult(intent, REQUEST_USAGE_STATS);
            }
        }
        
        if (type.equals("overlay") || type.equals("all")) {
            if (!hasOverlayPermission()) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                getActivity().startActivityForResult(intent, REQUEST_OVERLAY);
            }
        }
        
        // Return current permission status
        JSObject result = new JSObject();
        result.put("usageStats", hasUsageStatsPermission());
        result.put("overlay", hasOverlayPermission());
        result.put("all", hasUsageStatsPermission() && hasOverlayPermission());
        call.resolve(result);
    }

    /**
     * Get list of installed apps on the device
     */
    @PluginMethod
    public void getInstalledApps(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        List<ApplicationInfo> apps = pm.getInstalledApplications(PackageManager.GET_META_DATA);
        
        JSArray appsArray = new JSArray();
        
        for (ApplicationInfo appInfo : apps) {
            // Only include user-installed apps (not system apps)
            if ((appInfo.flags & ApplicationInfo.FLAG_SYSTEM) == 0) {
                JSObject app = new JSObject();
                app.put("name", pm.getApplicationLabel(appInfo).toString());
                app.put("packageName", appInfo.packageName);
                
                // Get app icon as base64 (simplified - you may want to cache this)
                try {
                    Drawable icon = pm.getApplicationIcon(appInfo);
                    // Convert drawable to base64 string
                    // Note: Full implementation would convert the drawable properly
                    app.put("icon", "📱"); // Placeholder - implement proper icon conversion
                } catch (Exception e) {
                    app.put("icon", "📱");
                }
                
                appsArray.put(app);
            }
        }
        
        JSObject result = new JSObject();
        result.put("apps", appsArray);
        call.resolve(result);
    }

    /**
     * Start blocking the specified apps
     */
    @PluginMethod
    public void startBlocking(PluginCall call) {
        JSArray packages = call.getArray("packages");
        int duration = call.getInt("duration", 1500); // Default 25 minutes
        
        if (packages == null || packages.length() == 0) {
            call.reject("No packages provided");
            return;
        }
        
        blockedPackages.clear();
        for (int i = 0; i < packages.length(); i++) {
            try {
                blockedPackages.add(packages.getString(i));
            } catch (Exception e) {
                // Skip invalid entries
            }
        }
        
        isBlocking = true;
        blockingStartTime = System.currentTimeMillis();
        blockingDuration = duration;
        
        // TODO: Start FocusModeService here
        // Intent serviceIntent = new Intent(getContext(), FocusModeService.class);
        // serviceIntent.putStringArrayListExtra("packages", new ArrayList<>(blockedPackages));
        // serviceIntent.putExtra("duration", duration);
        // getContext().startForegroundService(serviceIntent);
        
        call.resolve();
    }

    /**
     * Stop blocking apps
     */
    @PluginMethod
    public void stopBlocking(PluginCall call) {
        isBlocking = false;
        blockedPackages.clear();
        
        // TODO: Stop FocusModeService here
        // Intent serviceIntent = new Intent(getContext(), FocusModeService.class);
        // getContext().stopService(serviceIntent);
        
        call.resolve();
    }

    /**
     * Check if currently blocking
     */
    @PluginMethod
    public void isBlocking(PluginCall call) {
        JSObject result = new JSObject();
        result.put("isBlocking", isBlocking);
        
        JSArray packages = new JSArray();
        for (String pkg : blockedPackages) {
            packages.put(pkg);
        }
        result.put("packages", packages);
        
        if (isBlocking) {
            result.put("startTime", blockingStartTime);
            result.put("duration", blockingDuration);
        }
        
        call.resolve(result);
    }

    /**
     * Enter kiosk mode - locks user in the app
     */
    @PluginMethod
    public void enterKioskMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            // Start lock task mode (requires device admin for full effect)
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.startLockTask();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to enter kiosk mode: " + e.getMessage());
            }
        } else {
            call.reject("Activity not available");
        }
    }

    /**
     * Exit kiosk mode
     */
    @PluginMethod
    public void exitKioskMode(PluginCall call) {
        Activity activity = getActivity();
        if (activity != null) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    activity.stopLockTask();
                }
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to exit kiosk mode: " + e.getMessage());
            }
        } else {
            call.reject("Activity not available");
        }
    }

    /**
     * Check if kiosk mode is active
     */
    @PluginMethod
    public void isKioskModeActive(PluginCall call) {
        JSObject result = new JSObject();
        // Note: There's no direct API to check this, would need to track state
        result.put("active", false);
        call.resolve(result);
    }

    // Helper methods

    private boolean hasUsageStatsPermission() {
        AppOpsManager appOps = (AppOpsManager) getContext().getSystemService(Context.APP_OPS_SERVICE);
        int mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(),
            getContext().getPackageName()
        );
        return mode == AppOpsManager.MODE_ALLOWED;
    }

    private boolean hasOverlayPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            return Settings.canDrawOverlays(getContext());
        }
        return true;
    }

    /**
     * Get the currently running foreground app
     * Used by the background service to detect blocked apps
     */
    public String getForegroundApp() {
        UsageStatsManager usm = (UsageStatsManager) getContext().getSystemService(Context.USAGE_STATS_SERVICE);
        long time = System.currentTimeMillis();
        List<UsageStats> stats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, time - 1000 * 10, time);
        
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
}
