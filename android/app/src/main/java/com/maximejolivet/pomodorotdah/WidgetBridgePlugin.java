package com.maximejolivet.pomodorotdah;

import android.content.Context;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Transmet l'état du minuteur au widget : JSON écrit dans les préférences de l'app, puis
 * redessin des widgets posés. Le jumeau du `WidgetBridgePlugin.swift` d'iOS, au détail près
 * qu'Android n'a pas besoin d'App Group — le widget vit dans le même processus que l'app.
 */
@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void update(PluginCall call) {
        String json = call.getString("json");
        if (json == null) {
            call.reject("json manquant");
            return;
        }
        Context context = getContext();
        context.getSharedPreferences(WidgetState.PREFS, Context.MODE_PRIVATE)
            .edit()
            .putString(WidgetState.KEY, json)
            .apply();
        PomodoroWidgetProvider.updateAll(context);
        call.resolve();
    }
}
