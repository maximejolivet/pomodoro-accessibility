package com.maximejolivet.pomodorotdah;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.SystemClock;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONObject;

import java.util.Locale;

/**
 * Le décompte qui reste sous les yeux : une notification permanente, muette, dont le
 * chronomètre s'égrène tout seul — l'écran verrouillé dit le temps restant sans qu'on
 * déverrouille, et sans que l'app ait à tourner.
 *
 * Elle ne remplace pas les alertes de palier : celles-là sonnent et s'en vont, celle-ci se
 * tait et demeure. D'où un canal à part, en importance basse : ni son, ni vibration, ni
 * pastille — elle ne doit jamais couvrir ce qui, lui, doit s'entendre.
 */
@CapacitorPlugin(name = "LiveStatus")
public class LiveStatusPlugin extends Plugin {

    private static final String CHANNEL = "ongoing_v1";
    private static final int ID = 3000;

    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json manquant");
            return;
        }
        try {
            show(new JSONObject(json));
            call.resolve();
        } catch (Exception e) {
            call.reject("état illisible", e);
        }
    }

    @PluginMethod
    public void hide(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(ID);
        call.resolve();
    }

    private void show(JSONObject state) {
        Context context = getContext();
        JSONObject timer = state.optJSONObject("timer");
        if (timer == null) return;

        String status = timer.optString("state", "idle");
        long endAt = (long) timer.optDouble("endAt", 0);
        boolean running = "running".equals(status) && endAt > System.currentTimeMillis();
        boolean paused = "paused".equals(status);

        // Au repos, il n'y a pas de décompte à suivre : la notification n'aurait rien à dire.
        if (!running && !paused) {
            NotificationManagerCompat.from(context).cancel(ID);
            return;
        }

        createChannel(context);

        JSONObject labels = state.optJSONObject("labels");
        String pausedLabel = labels != null ? labels.optString("paused", "") : "";
        String name = timer.optString("name", "");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(name)
            .setOngoing(true)
            // Elle se réécrit à chaque changement : sans cela, chaque mise à jour rejouerait
            // l'arrivée de la notification, et le téléphone clignoterait pour rien.
            .setOnlyAlertOnce(true)
            .setShowWhen(false)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
            .setColor(parseColor(timer.optString("color", "#8b6fd6")))
            .setContentIntent(openApp(context));

        if (running) {
            // Le chronomètre est rendu par le système : il compte à rebours tout seul,
            // à la seconde, sans que l'app soit réveillée une seule fois.
            builder.setUsesChronometer(true)
                .setShowWhen(true)
                .setWhen(System.currentTimeMillis() + (endAt - System.currentTimeMillis()));
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                builder.setChronometerCountDown(true);
            } else {
                // Avant Android 7, le chronomètre ne sait que compter à l'endroit : on écrit
                // le temps restant, figé, plutôt que de laisser un compteur qui monte.
                builder.setUsesChronometer(false).setShowWhen(false)
                    .setContentText(format((endAt - System.currentTimeMillis()) / 1000.0));
            }
        } else {
            double left = timer.optDouble("remainingSeconds", timer.optDouble("dialSeconds", 0));
            builder.setContentText(
                pausedLabel.isEmpty() ? format(left) : format(left) + " · " + pausedLabel
            );
        }

        try {
            NotificationManagerCompat.from(context).notify(ID, builder.build());
        } catch (SecurityException denied) {
            // Notifications refusées (Android 13+) : le reste de l'app n'en dépend pas
        }
    }

    /** Canal muet : cette notification informe, elle n'alerte pas. */
    private void createChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL) != null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL, context.getString(R.string.ongoing_channel), NotificationManager.IMPORTANCE_LOW
        );
        channel.setDescription(context.getString(R.string.ongoing_channel_description));
        channel.setSound(null, null);
        channel.enableVibration(false);
        channel.setShowBadge(false);
        manager.createNotificationChannel(channel);
    }

    private PendingIntent openApp(Context context) {
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(context, 1, open, flags);
    }

    private static String format(double seconds) {
        int total = (int) Math.ceil(Math.max(0, seconds));
        return String.format(Locale.US, "%02d:%02d", total / 60, total % 60);
    }

    private static int parseColor(String hex) {
        try {
            return android.graphics.Color.parseColor(hex.startsWith("#") ? hex : "#" + hex);
        } catch (Exception e) {
            return android.graphics.Color.parseColor("#8b6fd6");
        }
    }
}
