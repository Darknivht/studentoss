package com.studentoss.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;

/**
 * BootReceiver - Restarts FocusModeService after device reboot
 * 
 * This receiver is triggered when the device boots up. If there was
 * an active focus session before the reboot, it will restart the
 * blocking service.
 */
public class BootReceiver extends BroadcastReceiver {

    @Override
    public void onReceive(Context context, Intent intent) {
        if (Intent.ACTION_BOOT_COMPLETED.equals(intent.getAction())) {
            // Check if there's an active focus session that needs to resume
            SharedPreferences prefs = context.getSharedPreferences("focus_mode", Context.MODE_PRIVATE);
            boolean wasBlocking = prefs.getBoolean("is_blocking", false);
            long endTime = prefs.getLong("end_time", 0);
            
            if (wasBlocking && System.currentTimeMillis() < endTime) {
                // Resume the focus session
                // Note: You would need to store blocked packages in SharedPreferences
                // and pass them to the service here
                
                // Intent serviceIntent = new Intent(context, FocusModeService.class);
                // context.startForegroundService(serviceIntent);
            }
        }
    }
}
