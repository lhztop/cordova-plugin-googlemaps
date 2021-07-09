package plugin.google.maps;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Looper;
import android.support.annotation.NonNull;
import android.support.v4.content.PermissionChecker;
import android.util.Log;

//import com.google.android.gms.common.ConnectionResult;
//import com.google.android.gms.common.api.GoogleApiClient;
//import com.amap.api.location.LocationCallback;
//import com.amap.api.maps.location.LocationRequest;
//import com.amap.api.maps.location.LocationResult;
//import com.amap.api.maps.location.LocationServices;
//import com.amap.api.maps.tasks.OnFailureListener;
//import com.amap.api.maps.tasks.OnSuccessListener;

import org.apache.cordova.CallbackContext;
import org.apache.cordova.CordovaInterface;
import org.apache.cordova.CordovaPlugin;
import org.apache.cordova.CordovaWebView;
import org.apache.cordova.PluginResult;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;

public class PluginLocationService extends CordovaPlugin {
  private Activity activity;
  private final String TAG = "PluginLocationService";
  private HashMap<String, Bundle> bufferForLocationDialog = new HashMap<String, Bundle>();

  private final int ACTIVITY_LOCATION_DIALOG = 0x7f999900; // Invite the location dialog using Google Play Services
  private final int ACTIVITY_LOCATION_PAGE = 0x7f999901;   // Open the location settings page

//  private GoogleApiClient googleApiClient = null;

  public void initialize(final CordovaInterface cordova, final CordovaWebView webView) {
    super.initialize(cordova, webView);
    activity = cordova.getActivity();
  }
  private static Location lastLocation = null;
  private ArrayList<CallbackContext> regularAccuracyRequestList = new ArrayList<CallbackContext>();
  private ArrayList<CallbackContext> highAccuracyRequestList = new ArrayList<CallbackContext>();
  public static final Object semaphore = new Object();

  public static void setLastLocation(Location location) {
    // Sets the last location if the end user click on the mylocation (blue dot)
    lastLocation = location;
  }


  @Override
  public boolean execute(final String action, final JSONArray args, final CallbackContext callbackContext) throws JSONException {

    cordova.getThreadPool().submit(new Runnable() {
      @Override
      public void run() {
        try {
          if ("getMyLocation".equals(action)) {
            PluginLocationService.this.getMyLocation(args, callbackContext);
          } else if ("hasPermission".equals(action)) {
            PluginLocationService.this.hasPermission(args, callbackContext);
          }

        } catch (JSONException e) {
          e.printStackTrace();
        }
      }
    });
    return true;

  }



  @SuppressWarnings("unused")
  public void hasPermission(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
    synchronized (semaphore) {
      // Check geolocation permission.
      boolean locationPermission = PermissionChecker.checkSelfPermission(cordova.getActivity().getApplicationContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PermissionChecker.PERMISSION_GRANTED;
      callbackContext.success(locationPermission ? 1 : 0);
    }
  }


      @SuppressWarnings("unused")
  public void getMyLocation(final JSONArray args, final CallbackContext callbackContext) throws JSONException {
  }

  private void requestLocation() {
    Log.d(TAG, "--->regularAccuracyRequestList.size = " + regularAccuracyRequestList.size());


  }

//  private void _checkLocationSettings() {
//
//    LocationSettingsRequest.Builder builder = new LocationSettingsRequest.Builder().setAlwaysShow(true);
//
//    LocationRequest locationRequest;
//    locationRequest = LocationRequest.create()
//        .setPriority(LocationRequest.PRIORITY_BALANCED_POWER_ACCURACY);
//    builder.addLocationRequest(locationRequest);
//
//    if (enableHighAccuracy) {
//      locationRequest = LocationRequest.create()
//          .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY);
//      builder.addLocationRequest(locationRequest);
//    }
//
//    PendingResult<LocationSettingsResult> locationSettingsResult =
//        LocationServices.SettingsApi.checkLocationSettings(googleApiClient, builder.build());
//
//    locationSettingsResult.setResultCallback(new ResultCallback<LocationSettingsResult>() {
//
//      @Override
//      public void onResult(@NonNull LocationSettingsResult result) {
//        final Status status = result.getStatus();
//        switch (status.getStatusCode()) {
//          case LocationSettingsStatusCodes.SUCCESS:
//            _requestLocationUpdate(false, enableHighAccuracy, callbackContext);
//            break;
//
//          case LocationSettingsStatusCodes.RESOLUTION_REQUIRED:
//            // Location settings are not satisfied. But could be fixed by showing the user
//            // a dialog.
//            try {
//              //Keep the callback id
//              Bundle bundle = new Bundle();
//              bundle.putInt("type", ACTIVITY_LOCATION_DIALOG);
//              bundle.putString("callbackId", callbackContext.getCallbackId());
//              bundle.putBoolean("enableHighAccuracy", enableHighAccuracy);
//              int hashCode = bundle.hashCode();
//
//              bufferForLocationDialog.put("bundle_" + hashCode, bundle);
//              //PluginLocationService.this.sendNoResult(callbackContext);
//
//              // Show the dialog by calling startResolutionForResult(),
//              // and check the result in onActivityResult().
//              cordova.setActivityResultCallback(PluginLocationService.this);
//              status.startResolutionForResult(cordova.getActivity(), hashCode);
//            } catch (IntentSender.SendIntentException e) {
//              // Show the dialog that is original version of this plugin.
//              _showLocationSettingsPage(enableHighAccuracy, callbackContext);
//            }
//            break;
//
//          case LocationSettingsStatusCodes.SETTINGS_CHANGE_UNAVAILABLE:
//            // Location settings are not satisfied. However, we have no way to fix the
//            // settings so we won't show the dialog.
//
//            JSONObject jsResult = new JSONObject();
//            try {
//              jsResult.put("status", false);
//              jsResult.put("error_code", "service_not_available");
//              jsResult.put("error_message", "This app has been rejected to use Location Services.");
//            } catch (JSONException e) {
//              e.printStackTrace();
//            }
//            callbackContext.error(jsResult);
//            break;
//        }
//      }
//
//    });
//  }
//
//  private void _showLocationSettingsPage(final boolean enableHighAccuracy, final CallbackContext callbackContext) {
//    //Ask the user to turn on the location services.
//    AlertDialog.Builder builder = new AlertDialog.Builder(this.activity);
//    builder.setTitle("Improve location accuracy");
//    builder.setMessage("To enhance your Maps experience:\n\n" +
//        " - Enable Google apps location access\n\n" +
//        " - Turn on GPS and mobile network location");
//    builder.setPositiveButton("Settings", new DialogInterface.OnClickListener() {
//        @Override
//        public void onClick(DialogInterface dialog, int which) {
//          //Keep the callback id
//          Bundle bundle = new Bundle();
//          bundle.putInt("type", ACTIVITY_LOCATION_PAGE);
//          bundle.putString("callbackId", callbackContext.getCallbackId());
//          bundle.putBoolean("enableHighAccuracy", enableHighAccuracy);
//          int hashCode = bundle.hashCode();
//
//          bufferForLocationDialog.put("bundle_" + hashCode, bundle);
//          //PluginLocationService.this.sendNoResult(callbackContext);
//
//          //Launch settings, allowing user to make a change
//          cordova.setActivityResultCallback(PluginLocationService.this);
//          Intent intent = new Intent(Settings.ACTION_LOCATION_SOURCE_SETTINGS);
//          activity.startActivityForResult(intent, hashCode);
//        }
//    });
//    builder.setNegativeButton("Skip", new DialogInterface.OnClickListener() {
//        @Override
//        public void onClick(DialogInterface dialog, int which) {
//          //No location service, no Activity
//          dialog.dismiss();
//
//          JSONObject result = new JSONObject();
//          try {
//            result.put("status", false);
//            result.put("error_code", "service_denied");
//            result.put("error_message", "This app has been rejected to use Location Services.");
//          } catch (JSONException e) {
//            e.printStackTrace();
//          }
//          callbackContext.error(result);
//        }
//    });
//    builder.create().show();
//  }



  private void _onActivityResultLocationPage(Bundle bundle) {
    String callbackId = bundle.getString("callbackId");
    CallbackContext callbackContext = new CallbackContext(callbackId, this.webView);

    LocationManager locationManager = (LocationManager) this.activity.getSystemService(Context.LOCATION_SERVICE);
    List<String> providers = locationManager.getAllProviders();
    int availableProviders = 0;
    //if (mPluginLayout != null && mPluginLayout.isDebug) {
      Log.d(TAG, "---debug at getMyLocation(available providers)--");
    //}
    Iterator<String> iterator = providers.iterator();
    String provider;
    boolean isAvailable;
    while(iterator.hasNext()) {
      provider = iterator.next();
      if ("passive".equals(provider)) {
        continue;
      }
      isAvailable = locationManager.isProviderEnabled(provider);
      if (isAvailable) {
        availableProviders++;
      }
      //if (mPluginLayout != null && mPluginLayout.isDebug) {
        Log.d(TAG, "   " + provider + " = " + (isAvailable ? "" : "not ") + "available");
      //}
    }
    if (availableProviders == 0) {
      JSONObject result = new JSONObject();
      try {
        result.put("status", false);
        result.put("error_code", "not_available");
        result.put("error_message", PluginUtil.getPgmStrings(activity,"pgm_no_location_providers"));
      } catch (JSONException e) {
        e.printStackTrace();
      }
      callbackContext.error(result);
      return;
    }

//    _inviteLocationUpdateAfterActivityResult(bundle);
  }


  @Override
  public void onActivityResult(int requestCode, int resultCode, Intent data) {
    super.onActivityResult(requestCode, resultCode, data);

    if (!bufferForLocationDialog.containsKey("bundle_" + requestCode)) {
      Log.e(TAG, "no key");
      return;
    }
    Bundle query = bufferForLocationDialog.get("bundle_" + requestCode);
    Log.d(TAG, "====> onActivityResult (" + resultCode + ")");

    switch (query.getInt("type")) {
      case ACTIVITY_LOCATION_DIALOG:
        // User was asked to enable the location setting.
        switch (resultCode) {
          case Activity.RESULT_OK:
            // All required changes were successfully made
//            _inviteLocationUpdateAfterActivityResult(query);
            break;
          case Activity.RESULT_CANCELED:
            // The user was asked to change settings, but chose not to
            _userRefusedToUseLocationAfterActivityResult(query);
            break;
          default:
            break;
        }
        break;
      case ACTIVITY_LOCATION_PAGE:
        _onActivityResultLocationPage(query);
        break;
    }
  }
  private void _userRefusedToUseLocationAfterActivityResult(Bundle bundle) {
    String callbackId = bundle.getString("callbackId");
    CallbackContext callbackContext = new CallbackContext(callbackId, this.webView);
    JSONObject result = new JSONObject();
    try {
      result.put("status", false);
      result.put("error_code", "service_denied");
      result.put("error_message", PluginUtil.getPgmStrings(activity,"pgm_location_rejected_by_user"));
    } catch (JSONException e) {
      e.printStackTrace();
    }
    callbackContext.error(result);
  }

  public void onRequestPermissionResult(int requestCode, String[] permissions,
                                        int[] grantResults) throws JSONException {
    synchronized (semaphore) {
      semaphore.notify();
    }
  }

}
