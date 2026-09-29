package com.maximejolivet.pomodorotdah;

import android.content.Context;
import android.content.SharedPreferences;
import android.graphics.Color;

import org.json.JSONObject;

/**
 * État écrit par l'app (WidgetBridgePlugin), en JSON. Même contrat que le `WidgetState`
 * TypeScript et que celui du widget iOS : toute évolution se fait des trois côtés.
 * Les libellés arrivent déjà traduits dans la langue choisie dans l'app.
 */
final class WidgetState {

    static final String PREFS = "pomodoro_widget";
    static final String KEY = "widgetState";

    /** Début (ms) du jour auquel se rapporte focusMinutes. */
    final long dayStart;
    final int focusMinutes;
    final int goalMinutes;
    /** running | paused | idle */
    final String state;
    final String name;
    final int color;
    /** Heure de fin (ms depuis 1970) quand le décompte tourne, 0 sinon. */
    final long endAt;
    /** Ce que le cadran montre à l'écriture : durée réglée au repos, temps restant en pause. */
    final double dialSeconds;
    /** Vrai quand la graduation vaut des secondes : une étape qui dure moins d'une minute. */
    final boolean inSeconds;
    final String labelToday;
    final String labelGoalReached;
    final String labelPaused;
    final String labelReady;
    final String labelFinished;
    final String labelSecShort;
    final boolean dark;

    private WidgetState(JSONObject json) {
        JSONObject timer = json.optJSONObject("timer");
        if (timer == null) timer = new JSONObject();
        JSONObject labels = json.optJSONObject("labels");
        if (labels == null) labels = new JSONObject();

        dayStart = (long) json.optDouble("dayStart", 0);
        focusMinutes = json.optInt("focusMinutes", 0);
        goalMinutes = json.optInt("goalMinutes", 0);
        state = timer.optString("state", "idle");
        name = timer.optString("name", "");
        color = parseColor(timer.optString("color", "#8b6fd6"));
        endAt = (long) timer.optDouble("endAt", 0);
        inSeconds = "seconds".equals(timer.optString("dialUnit", "minutes"));
        double paused = timer.optDouble("remainingSeconds", Double.NaN);
        double dial = timer.optDouble("dialSeconds", Double.NaN);
        dialSeconds = !Double.isNaN(paused) ? paused : (Double.isNaN(dial) ? 0 : dial);
        labelToday = labels.optString("today", "");
        labelGoalReached = labels.optString("goalReached", "");
        labelPaused = labels.optString("paused", "");
        labelReady = labels.optString("ready", "");
        labelFinished = labels.optString("finished", "");
        labelSecShort = labels.optString("secShort", "s");
        dark = json.optBoolean("dark", false);
    }

    /** L'état enregistré, ou un aperçu quand l'app n'a encore rien écrit (galerie de widgets). */
    static WidgetState load(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String json = prefs.getString(KEY, null);
        if (json != null) {
            try {
                return new WidgetState(new JSONObject(json));
            } catch (Exception ignored) {
                // JSON illisible : mieux vaut l'aperçu qu'un widget vide
            }
        }
        try {
            return new WidgetState(new JSONObject(
                "{\"dayStart\":0,\"focusMinutes\":0,\"goalMinutes\":100,"
                    + "\"timer\":{\"state\":\"idle\",\"name\":\"Pomodoro\",\"color\":\"#8b6fd6\","
                    + "\"dialUnit\":\"minutes\",\"dialSeconds\":1500},"
                    + "\"labels\":{\"today\":\"Focus\",\"ready\":\"Pomodoro\"},\"dark\":false}"
            ));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    boolean isRunning() {
        return "running".equals(state) && endAt > System.currentTimeMillis();
    }

    boolean isPaused() {
        return "paused".equals(state);
    }

    /** Le décompte a atteint 0 depuis la dernière écriture de l'app. */
    boolean isFinished() {
        return "running".equals(state) && endAt <= System.currentTimeMillis();
    }

    /** Secondes restantes maintenant : déduites de l'heure de fin, sinon telles qu'écrites. */
    double secondsLeft() {
        if ("running".equals(state) && endAt > 0) {
            return Math.max(0, (endAt - System.currentTimeMillis()) / 1000.0);
        }
        return dialSeconds;
    }

    /** Ce que le cadran gradue, toujours de 0 à 60 : des secondes ou des minutes. */
    double dialUnits() {
        double left = secondsLeft();
        return Math.min(60, inSeconds ? left : left / 60);
    }

    /** Minutes de focus du jour affiché : 0 si l'app n'a rien écrit depuis minuit. */
    int focusToday() {
        java.util.Calendar midnight = java.util.Calendar.getInstance();
        midnight.set(java.util.Calendar.HOUR_OF_DAY, 0);
        midnight.set(java.util.Calendar.MINUTE, 0);
        midnight.set(java.util.Calendar.SECOND, 0);
        midnight.set(java.util.Calendar.MILLISECOND, 0);
        return dayStart < midnight.getTimeInMillis() ? 0 : focusMinutes;
    }

    private static int parseColor(String hex) {
        try {
            return Color.parseColor(hex.startsWith("#") ? hex : "#" + hex);
        } catch (Exception e) {
            return Color.parseColor("#8b6fd6");
        }
    }
}
