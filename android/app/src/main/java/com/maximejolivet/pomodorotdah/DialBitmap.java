package com.maximejolivet.pomodorotdah;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;

/**
 * Le cadran du minuteur, dessiné dans un bitmap : un widget ne sait pas exécuter de vue à
 * lui, c'est donc l'app qui peint et le widget qui affiche l'image.
 *
 * Port de `src/app/features/timer/dial-geometry.ts` : même repère 420 × 420, mêmes rayons,
 * mêmes douze couleurs, même sens anti-horaire depuis 0 — et des mêmes jetons de `src/theme/`
 * pour les couleurs de face. Le cadran du widget est le cadran de l'app, à l'échelle près.
 */
final class DialBitmap {

    private static final float SIZE = 420f;
    private static final float CX = 217f;
    private static final float CY = 218f;
    private static final float RING_OUTER = 150f;
    private static final float RING_INNER = 102f;
    private static final float DISK_R = 147f;
    private static final float LABEL_R = 181f;

    /** De 0-5 min (rouge) à 55-60 min (magenta). */
    private static final String[] SEGMENTS = {
        "#d63f4f", "#e5593a", "#ef7d2d", "#f3a52b", "#f0c52f", "#c3cd36",
        "#56b27b", "#5d9fb6", "#5d6db3", "#5a55a3", "#6c4b9c", "#b24f97"
    };

    private DialBitmap() {}

    /**
     * @param units ce que le cadran montre, de 0 à 60
     * @param px    côté du bitmap en pixels
     */
    static Bitmap render(double units, int color, boolean dark, String secondsLabel, int px) {
        Bitmap bitmap = Bitmap.createBitmap(px, px, Bitmap.Config.ARGB_8888);
        Canvas canvas = new Canvas(bitmap);
        float scale = px / SIZE;
        canvas.scale(scale, scale);

        int face = Color.parseColor(dark ? "#22272c" : "#fbfbf8");
        int ink = Color.parseColor(dark ? "#e8ecee" : "#2f3336");
        int muted = Color.parseColor(dark ? "#a0abb1" : "#5f6a6f");
        int tab = Color.parseColor(dark ? "#e8ecee" : "#1d282d");

        Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        fill.setStyle(Paint.Style.FILL);

        // L'anneau de couleurs : douze segments de cinq minutes.
        for (int i = 0; i < 12; i++) {
            fill.setColor(Color.parseColor(SEGMENTS[i]));
            canvas.drawPath(segment(i * 5, (i + 1) * 5), fill);
        }

        if (units > 0) {
            // Le voile multiplie, comme `mix-blend-mode: multiply` dans l'app : l'anneau
            // transparaît sous la couleur du mode au lieu d'être effacé par elle.
            Paint veil = new Paint(Paint.ANTI_ALIAS_FLAG);
            veil.setColor(color);
            veil.setAlpha(235);
            veil.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.MULTIPLY));
            canvas.drawPath(sector(DISK_R, units), veil);

            // Le plateau central, plein, avec la lumière prise en haut à gauche.
            Paint plate = new Paint(Paint.ANTI_ALIAS_FLAG);
            plate.setShader(new RadialGradient(
                CX, CY - RING_INNER * 0.2f, RING_INNER * 1.3f,
                new int[] { lighten(color), color }, null, Shader.TileMode.CLAMP
            ));
            canvas.drawPath(sector(RING_INNER, units), plate);
        }

        // Douze fentes de la couleur de la face, entre les segments.
        Paint line = new Paint(Paint.ANTI_ALIAS_FLAG);
        line.setStyle(Paint.Style.STROKE);
        line.setColor(face);
        line.setStrokeWidth(4);
        for (int i = 0; i < 12; i++) {
            float[] a = point(RING_INNER - 2, i * 5);
            float[] b = point(RING_OUTER + 1, i * 5);
            canvas.drawLine(a[0], a[1], b[0], b[1], line);
        }

        // Le trait blanc qui dit où en est le temps.
        if (units > 0 && units < 60) {
            Paint edge = new Paint(Paint.ANTI_ALIAS_FLAG);
            edge.setStyle(Paint.Style.STROKE);
            edge.setColor(Color.WHITE);
            edge.setAlpha(230);
            edge.setStrokeWidth(2.5f);
            edge.setStrokeCap(Paint.Cap.ROUND);
            float[] e = point(DISK_R, units);
            canvas.drawLine(CX, CY, e[0], e[1], edge);
        }

        // La languette du disque, à la même inclinaison que le bord.
        fill.setColor(tab);
        canvas.save();
        canvas.translate(CX, CY);
        canvas.rotate((float) (-units * 6));
        canvas.drawRoundRect(new RectF(-14, -160.5f, 14, -153.5f), 3.5f, 3.5f, fill);
        canvas.restore();

        // Les graduations chiffrées, 0 à 55.
        Paint text = new Paint(Paint.ANTI_ALIAS_FLAG);
        text.setColor(ink);
        text.setTextSize(27);
        text.setTextAlign(Paint.Align.CENTER);
        text.setFakeBoldText(false);
        Paint.FontMetrics fm = text.getFontMetrics();
        float baseline = -(fm.ascent + fm.descent) / 2;
        for (int i = 0; i < 12; i++) {
            float[] p = point(LABEL_R, i * 5);
            canvas.drawText(String.valueOf(i * 5), p[0], p[1] + baseline, text);
        }

        // L'unité, seulement en secondes : sans elle, 20 secondes se lirait 20 minutes.
        if (secondsLabel != null) {
            text.setColor(muted);
            text.setTextSize(21);
            text.setFakeBoldText(true);
            canvas.drawText(secondsLabel.toUpperCase(), CX, CY + 66 + baseline, text);
        }

        // Le bouton central : joint sombre, index, capuchon nacré.
        fill.setColor(Color.parseColor("#1d282d"));
        canvas.drawCircle(CX, CY, 31, fill);
        fill.setColor(Color.parseColor("#b3d4dd"));
        canvas.save();
        canvas.translate(CX, CY);
        canvas.rotate((float) (-units * 6));
        canvas.drawRoundRect(new RectF(-6, -47, 6, -21), 6, 6, fill);
        canvas.restore();

        Paint knob = new Paint(Paint.ANTI_ALIAS_FLAG);
        knob.setShader(new RadialGradient(
            CX - 6, CY - 9, 34,
            new int[] { Color.parseColor("#e4f2f6"), Color.parseColor("#b3d4dd"), Color.parseColor("#8db5c0") },
            new float[] { 0f, 0.55f, 1f }, Shader.TileMode.CLAMP
        ));
        canvas.drawCircle(CX, CY, 26, knob);

        fill.setColor(Color.WHITE);
        fill.setAlpha(140);
        canvas.drawOval(new RectF(CX - 17, CY - 15, CX + 3, CY - 3), fill);

        return bitmap;
    }

    /** Point à un rayon donné, pour une valeur de 0 à 60 (anti-horaire depuis le haut). */
    private static float[] point(float r, double units) {
        double rad = -units * 6 * Math.PI / 180;
        return new float[] { CX + (float) (r * Math.sin(rad)), CY - (float) (r * Math.cos(rad)) };
    }

    /** Secteur plein de 0 jusqu'à `units`, comme `sectorPath`. */
    private static Path sector(float r, double units) {
        Path path = new Path();
        RectF box = new RectF(CX - r, CY - r, CX + r, CY + r);
        if (units >= 60) {
            path.addCircle(CX, CY, r, Path.Direction.CW);
            return path;
        }
        path.moveTo(CX, CY);
        path.lineTo(CX, CY - r);
        // Canvas compte en degrés horaires depuis 3 h : le haut est à -90, et on recule.
        path.arcTo(box, -90, (float) (-units * 6));
        path.close();
        return path;
    }

    /** Un des douze segments de l'anneau, comme `annulusPath`. */
    private static Path segment(double from, double to) {
        Path path = new Path();
        RectF outer = new RectF(CX - RING_OUTER, CY - RING_OUTER, CX + RING_OUTER, CY + RING_OUTER);
        RectF inner = new RectF(CX - RING_INNER, CY - RING_INNER, CX + RING_INNER, CY + RING_INNER);
        float start = (float) (-90 - from * 6);
        float sweep = (float) (-(to - from) * 6);
        float[] a = point(RING_OUTER, from);
        path.moveTo(a[0], a[1]);
        path.arcTo(outer, start, sweep);
        float[] b = point(RING_INNER, to);
        path.lineTo(b[0], b[1]);
        path.arcTo(inner, start + sweep, -sweep);
        path.close();
        return path;
    }

    /** Le haut du plateau, un peu plus clair : la même lumière que le dégradé de l'app. */
    private static int lighten(int color) {
        return Color.argb(
            217,
            Math.min(255, (int) (Color.red(color) * 1.08)),
            Math.min(255, (int) (Color.green(color) * 1.08)),
            Math.min(255, (int) (Color.blue(color) * 1.08))
        );
    }
}
