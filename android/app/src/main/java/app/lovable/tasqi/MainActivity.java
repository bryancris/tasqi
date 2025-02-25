
package app.lovable.tasqi;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.os.Build;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        createNotificationChannel();
    }

    private void createNotificationChannel() {
        // Create the NotificationChannel, but only on API 26+ because
        // the NotificationChannel class is new and not in the support library
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            // Task Reminders Channel
            CharSequence reminderName = "Task Reminders";
            String reminderDescription = "Notifications for upcoming tasks and deadlines";
            NotificationChannel reminderChannel = new NotificationChannel(
                "task_reminders",
                reminderName,
                NotificationManager.IMPORTANCE_HIGH
            );
            reminderChannel.setDescription(reminderDescription);
            reminderChannel.enableVibration(true);
            reminderChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500});
            // Enable lock screen visibility
            reminderChannel.setLockscreenVisibility(NotificationManager.VISIBILITY_PUBLIC);
            // Enable lights
            reminderChannel.enableLights(true);
            // Show badge
            reminderChannel.setShowBadge(true);
            // Allow notification to bypass Do Not Disturb
            reminderChannel.setBypassDnd(true);
            
            // Shared Tasks Channel
            CharSequence shareName = "Shared Tasks";
            String shareDescription = "Notifications for tasks shared with you";
            NotificationChannel shareChannel = new NotificationChannel(
                "shared_tasks",
                shareName,
                NotificationManager.IMPORTANCE_HIGH
            );
            shareChannel.setDescription(shareDescription);
            shareChannel.enableVibration(true);
            shareChannel.setVibrationPattern(new long[]{100, 200, 300, 400, 500});
            // Enable lock screen visibility
            shareChannel.setLockscreenVisibility(NotificationManager.VISIBILITY_PUBLIC);
            // Enable lights
            shareChannel.enableLights(true);
            // Show badge
            shareChannel.setShowBadge(true);
            // Allow notification to bypass Do Not Disturb
            shareChannel.setBypassDnd(true);

            // Register the channels with the system
            NotificationManager notificationManager = getSystemService(NotificationManager.class);
            notificationManager.createNotificationChannel(reminderChannel);
            notificationManager.createNotificationChannel(shareChannel);
        }
    }
}
