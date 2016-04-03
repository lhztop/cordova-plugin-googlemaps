package plugin.google.maps;

import android.util.Log;

import com.google.android.gms.maps.model.LatLng;
import com.google.android.gms.maps.model.LatLngBounds;
import com.google.android.gms.maps.model.Polygon;
import com.google.android.gms.maps.model.PolygonOptions;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginEntry;
import org.apache.cordova.PluginManager;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.lang.reflect.Method;
import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

public class PluginPolygon extends MyPlugin implements MyPluginInterface  {
/*
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) throws JSONException {
        if ("createPolygon".equals(action)) {
            this.createPolygon(args, callbackContext);
            return true;
        } else if (methods.containsKey(action)) {
            Method method = methods.get(action);
            try {
                Log.d("Polygon", "method=" + method);
                method.invoke(self, args, callbackContext);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                callbackContext.error(e.getMessage());
                return false;
            }
        } else {
            return false;
        }

        //return super.execute(action, args, callbackContext);
    }
    */

    /**
     * Create polygon
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    @Override
    public void create(final JSONArray args, final CallbackContext callbackContext) throws JSONException {

        final PolygonOptions polygonOptions = new PolygonOptions();
        int color;
        final LatLngBounds.Builder builder = new LatLngBounds.Builder();

        JSONObject opts = args.getJSONObject(0);
        if (opts.has("points")) {
            JSONArray points = opts.getJSONArray("points");
            List<LatLng> path = PluginUtil.JSONArray2LatLngList(points);
            for (int i = 0; i < path.size(); i++) {
                polygonOptions.add(path.get(i));
                builder.include(path.get(i));
            }
        }

        if (opts.has("holes")) {
            JSONArray holes = opts.getJSONArray("holes");
            int i;
            JSONArray latLngArray;
            for (i = 0; i < holes.length(); i++) {
                latLngArray = holes.getJSONArray(i);
                polygonOptions.addHole(PluginUtil.JSONArray2LatLngList(latLngArray));
            }

        }
        if (opts.has("strokeColor")) {
            color = PluginUtil.parsePluginColor(opts.getJSONArray("strokeColor"));
            polygonOptions.strokeColor(color);
        }
        if (opts.has("fillColor")) {
            color = PluginUtil.parsePluginColor(opts.getJSONArray("fillColor"));
            polygonOptions.fillColor(color);
        }
        if (opts.has("strokeWidth")) {
            polygonOptions.strokeWidth(opts.getInt("strokeWidth") * this.density);
        }
        if (opts.has("visible")) {
            polygonOptions.visible(opts.getBoolean("visible"));
        }
        if (opts.has("geodesic")) {
            polygonOptions.geodesic(opts.getBoolean("geodesic"));
        }
        if (opts.has("zIndex")) {
            polygonOptions.zIndex(opts.getInt("zIndex"));
        }


        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                Polygon polygon = map.addPolygon(polygonOptions);
                String id = "polygon_"+ polygon.getId();
                self.objects.put(id, polygon);

                String boundsId = "polygon_bounds_" + polygon.getId();
                self.objects.put(boundsId, builder.build());

                JSONObject result = new JSONObject();
                try {
                    result.put("hashCode", polygon.hashCode());
                    result.put("id", id);
                } catch (JSONException e) {
                    e.printStackTrace();
                }
                callbackContext.success(result);
            }
        });
    }


    /**
     * set fill color
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setFillColor(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        int color = PluginUtil.parsePluginColor(args.getJSONArray(1));
        this.setInt("setFillColor", id, color, callbackContext);
    }

    /**
     * set stroke color
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setStrokeColor(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        int color = PluginUtil.parsePluginColor(args.getJSONArray(1));
        this.setInt("setStrokeColor", id, color, callbackContext);
    }

    /**
     * set stroke width
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    @SuppressWarnings("unused")
    public void setStrokeWidth(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        float width = (float) args.getDouble(1) * this.density;
        this.setFloat("setStrokeWidth", id, width, callbackContext);
    }

    /**
     * set z-index
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    @SuppressWarnings("unused")
    public void setZIndex(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        float zIndex = (float) args.getDouble(1);
        this.setFloat("setZIndex", id, zIndex, callbackContext);
    }

    /**
     * set geodesic
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setGeodesic(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        boolean isGeodisic = args.getBoolean(1);
        this.setBoolean("setGeodesic", id, isGeodisic, callbackContext);
    }

    /**
     * Remove the polygon
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void remove(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        final Polygon polygon = this.getPolygon(id);
        if (polygon == null) {
            this.sendNoResult(callbackContext);
            return;
        }
        this.objects.remove(id);

        id = "polygon_bounds_" + polygon.getId();
        this.objects.remove(id);

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                polygon.remove();
                sendNoResult(callbackContext);
            }
        });
    }

    /**
     * Set holes
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setHoles(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);

        final Polygon polygon = this.getPolygon(id);

        JSONArray holesJSONArray = args.getJSONArray(1);
        final List<List<LatLng>> holes = new LinkedList<List<LatLng>>();

        for (int i = 0; i < holesJSONArray.length(); i++) {
            JSONArray holeJSONArray = holesJSONArray.getJSONArray(i);
            holes.add(PluginUtil.JSONArray2LatLngList(holeJSONArray));
        }

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                polygon.setHoles(holes);
                PluginPolygon.this.sendNoResult(callbackContext);
            }
        });

    }

    /**
     * Set points
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setPoints(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
        String id = args.getString(0);
        final Polygon polygon = this.getPolygon(id);

        JSONArray points = args.getJSONArray(1);
        final List<LatLng> path = PluginUtil.JSONArray2LatLngList(points);

        LatLngBounds.Builder builder = new LatLngBounds.Builder();
        for (int i = 0; i < path.size(); i++) {
            builder.include(path.get(i));
        }
        this.objects.put("polygon_bounds_" + polygon.getId(), builder.build());

        cordova.getActivity().runOnUiThread(new Runnable() {
            @Override
            public void run() {
                polygon.setPoints(path);
                sendNoResult(callbackContext);
            }
        });
        this.sendNoResult(callbackContext);
    }

    /**
     * Set visibility for the object
     * @param args
     * @param callbackContext
     * @throws JSONException
     */
    public void setVisible(JSONArray args, CallbackContext callbackContext) throws JSONException {
        boolean visible = args.getBoolean(1);
        String id = args.getString(0);
        this.setBoolean("setVisible", id, visible, callbackContext);
    }
}
