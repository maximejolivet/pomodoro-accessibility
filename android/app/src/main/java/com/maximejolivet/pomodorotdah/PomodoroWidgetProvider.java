package com.maximejolivet.pomodorotdah;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.graphics.Bitmap;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.TypedValue;
import android.view.View;
import android.widget.RemoteViews;

import java.util.Locale;

/**
 * Widget d'écran d'accueil : le cadran de l'app, et sous lui le temps et le mode.
 *
 * Deux horloges cohabitent, et c'est ce qui rend le widget tenable pour la batterie :
 * le <b>chronomètre</b> égrène les secondes tout seul, sans que rien ne le réveille, et une
 * <b>alarme</b> ne redessine le cadran qu'au changement de graduation — une fois par minute.
 * Le décompte arrêté, l'alarme l'est aussi : un cadran figé n'a aucune raison de réveiller
 * le téléphone.
 */
public class PomodoroWidgetProvider extends AppWidgetProvider {

    static final String ACTION_TICK = "com.maximejolivet.pomodorotdah.WIDGET_TICK";

    /** Au-delà de cette largeur, le widget a la place d'afficher le temps à côté du cadran. */
    private static final int WIDE_DP = 220;

    /** Le bitmap voyage par IPC : au-delà, la transaction casse. 320 px suffisent largement. */
    private static final int MAX_DIAL_PX = 320;

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] ids) {
        for (int id : ids) render(context, manager, id);
        scheduleTick(context);
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int id, Bundle options) {
        render(context, manager, id);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (ACTION_TICK.equals(intent.getAction())) updateAll(context);
    }

    @Override
    public void onDisabled(Context context) {
        cancelTick(context);
    }

    /** Appelé par le pont quand l'app écrit un nouvel état, et à chaque battement. */
    static void updateAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(new ComponentName(context, PomodoroWidgetProvider.class));
        for (int id : ids) render(context, manager, id);
        scheduleTick(context);
    }

    private static void render(Context context, AppWidgetManager manager, int id) {
        WidgetState state = WidgetState.load(context);
        Bundle options = manager.getAppWidgetOptions(id);
        int widthDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 110);
        int heightDp = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110);
        boolean wide = widthDp >= WIDE_DP;

        RemoteViews views = new RemoteViews(
            context.getPackageName(),
            wide ? R.layout.widget_pomodoro_wide : R.layout.widget_pomodoro
        );

        views.setInt(R.id.widget_root, "setBackgroundResource",
            state.dark ? R.drawable.widget_bg_dark : R.drawable.widget_bg_light);

        // Le cadran fait la hauteur disponible en large, la largeur en compact.
        int sideDp = wide ? heightDp : widthDp;
        int px = Math.min(MAX_DIAL_PX, Math.max(96, dpToPx(context, sideDp - 16)));
        Bitmap dial = DialBitmap.render(
            state.dialUnits(), state.color, state.dark,
            state.inSeconds ? state.labelSecShort : null, px
        );
        views.setImageViewBitmap(R.id.widget_dial, dial);

        views.setInt(R.id.widget_dot, "setColorFilter", state.color);
        int ink = state.dark ? 0xFFE8ECEE : 0xFF2F3336;
        int muted = state.dark ? 0xFFA0ABB1 : 0xFF5F6A6F;

        // Le chronomètre ne sert qu'au décompte en cours : lui seul avance tout seul.
        if (state.isRunning()) {
            long base = SystemClock.elapsedRealtime() + (state.endAt - System.currentTimeMillis());
            views.setChronometer(R.id.widget_time, base, null, true);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                views.setChronometerCountDown(R.id.widget_time, true);
            }
            views.setViewVisibility(R.id.widget_time, View.VISIBLE);
            views.setViewVisibility(R.id.widget_time_static, View.GONE);
            views.setTextColor(R.id.widget_time, wide ? state.color : ink);
        } else {
            views.setChronometer(R.id.widget_time, SystemClock.elapsedRealtime(), null, false);
            views.setViewVisibility(R.id.widget_time, View.GONE);
            views.setViewVisibility(R.id.widget_time_static, View.VISIBLE);
            views.setTextViewText(R.id.widget_time_static, formatSeconds(state.secondsLeft()));
            views.setTextColor(R.id.widget_time_static, state.isPaused() ? muted : ink);
        }

        String name = state.isFinished() ? state.labelFinished : state.name;
        views.setTextViewText(R.id.widget_mode, name);
        views.setTextColor(R.id.widget_mode, wide ? ink : muted);

        if (wide) {
            views.setTextViewText(R.id.widget_state, state.isPaused() ? state.labelPaused : "");
            views.setViewVisibility(R.id.widget_state, state.isPaused() ? View.VISIBLE : View.GONE);
            views.setTextColor(R.id.widget_state, muted);

            int focus = state.focusToday();
            boolean reached = state.goalMinutes > 0 && focus >= state.goalMinutes;
            views.setTextViewText(R.id.widget_goal_label, reached ? state.labelGoalReached : state.labelToday);
            views.setTextViewText(R.id.widget_goal_value, focus + " / " + state.goalMinutes + " min");
            views.setTextColor(R.id.widget_goal_label, muted);
            views.setTextColor(R.id.widget_goal_value, muted);
            views.setProgressBar(R.id.widget_goal, Math.max(1, state.goalMinutes), focus, false);
        }

        // Toucher le widget ouvre l'app, et rien d'autre : il montre, il ne commande pas.
        Intent open = context.getPackageManager().getLaunchIntentForPackage(context.getPackageName());
        if (open != null) {
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
            views.setOnClickPendingIntent(
                R.id.widget_root, PendingIntent.getActivity(context, 0, open, flags)
            );
        }

        manager.updateAppWidget(id, views);
    }

    /**
     * Pose l'alarme du prochain changement de graduation, et seulement si le décompte tourne.
     * Une minute sur un cadran gradué en minutes ; cinq secondes quand il compte des secondes,
     * où une alarme par seconde coûterait plus que ce qu'elle montre.
     */
    private static void scheduleTick(Context context) {
        WidgetState state = WidgetState.load(context);
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        PendingIntent pending = tickIntent(context);

        if (!state.isRunning()) {
            alarms.cancel(pending);
            return;
        }

        long step = state.inSeconds ? 5000 : 60_000;
        long remaining = Math.max(0, state.endAt - System.currentTimeMillis());
        long untilNext = remaining % step;
        if (untilNext < 1000) untilNext += step;
        long at = System.currentTimeMillis() + untilNext;

        // Alarme exacte quand le système l'accorde — toujours le cas avant Android 12 —
        // sinon une alarme ordinaire : le cadran retardera un peu, il ne s'arrêtera pas.
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms()) {
            alarms.setExact(AlarmManager.RTC, at, pending);
        } else {
            alarms.set(AlarmManager.RTC, at, pending);
        }
    }

    private static void cancelTick(Context context) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (alarms != null) alarms.cancel(tickIntent(context));
    }

    private static PendingIntent tickIntent(Context context) {
        Intent intent = new Intent(context, PomodoroWidgetProvider.class).setAction(ACTION_TICK);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(context, 0, intent, flags);
    }

    private static String formatSeconds(double seconds) {
        int total = (int) Math.ceil(seconds);
        return String.format(Locale.US, "%02d:%02d", total / 60, total % 60);
    }

    private static int dpToPx(Context context, int dp) {
        return (int) TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP, dp, context.getResources().getDisplayMetrics()
        );
    }
}
