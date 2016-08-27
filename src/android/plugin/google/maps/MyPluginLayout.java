package plugin.google.maps;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Context;
import android.content.res.Resources;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PointF;
import android.graphics.Rect;
import android.graphics.RectF;
import android.os.Bundle;
import android.util.Log;
import android.view.Gravity;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewTreeObserver;
import android.widget.AbsoluteLayout;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;

import com.google.android.gms.maps.MapView;

import org.json.JSONObject;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

@SuppressWarnings("deprecation")
public class MyPluginLayout extends FrameLayout implements ViewTreeObserver.OnScrollChangedListener {
  private View browserView;
  private ViewGroup root;
  private Context context;
  private FrontLayerLayout frontLayer;
  private ScrollView scrollView = null;
  public FrameLayout scrollFrameLayout = null;
  public HashMap<String, PluginMap> pluginMaps = new HashMap<String, PluginMap>();
  private HashMap<String, TouchableWrapper> touchableWrappers = new HashMap<String, TouchableWrapper>();
  private boolean isScrolling = false;
  private boolean isDebug = false;
  public HashMap<String, Bundle> HTMLNodes = new HashMap<String, Bundle>();
  private HashMap<String, RectF> HTMLNodeRectFs = new HashMap<String, RectF>();
  private Activity mActivity = null;
  private Paint debugPaint = new Paint();
  public boolean stopFlag = false;
  public boolean needUpdatePosition = false;
  private float zoomScale;
  
  @SuppressLint("NewApi")
  public MyPluginLayout(View browserView, Activity activity) {
    super(browserView.getContext());
    mActivity = activity;
    this.browserView = browserView;
    this.root = (ViewGroup) browserView.getParent();
    this.context = browserView.getContext();
    //if (VERSION.SDK_INT >= 21 || "org.xwalk.core.XWalkView".equals(browserView.getClass().getName())) {
    //  browserView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
    //}

    zoomScale = Resources.getSystem().getDisplayMetrics().density;
    frontLayer = new FrontLayerLayout(this.context);

    scrollView = new ScrollView(this.context);
    scrollView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT));

    scrollView.getViewTreeObserver().addOnScrollChangedListener(MyPluginLayout.this);

    root.removeView(browserView);
    frontLayer.addView(browserView);

    scrollFrameLayout = new FrameLayout(this.context);
    scrollFrameLayout.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT));


    View dummyView = new View(this.context);
    dummyView.setLayoutParams(new LayoutParams(1, 99999));
    scrollFrameLayout.addView(dummyView);

    scrollView.setHorizontalScrollBarEnabled(true);
    scrollView.setVerticalScrollBarEnabled(true);
    scrollView.addView(scrollFrameLayout);



    this.addView(scrollView);
    this.addView(frontLayer);
    root.addView(this);



    browserView.setBackgroundColor(Color.TRANSPARENT);
    if("org.xwalk.core.XWalkView".equals(browserView.getClass().getName())
      || "org.crosswalk.engine.XWalkCordovaView".equals(browserView.getClass().getName())) {
      try {
    /* view.setZOrderOnTop(true)
     * Called just in time as with root.setBackground(...) the color
     * come in front and take the whole screen */
        browserView.getClass().getMethod("setZOrderOnTop", boolean.class)
          .invoke(browserView, true);
      }
      catch(Exception e) {
        e.printStackTrace();
      }
    }
    scrollView.setHorizontalScrollBarEnabled(false);
    scrollView.setVerticalScrollBarEnabled(false);

    //backgroundView.setLayoutParams(new LayoutParams(LayoutParams.MATCH_PARENT, (int) (view.getContentHeight() * view.getScale() + view.getHeight())));


    mActivity.getWindow().getDecorView().requestFocus();
  }

  public void putHTMLElements(JSONObject elements) {

    HashMap<String, Bundle> newBuffer = new HashMap<String, Bundle>();
    HashMap<String, RectF> newBufferRectFs = new HashMap<String, RectF>();

    Bundle elementsBundle = PluginUtil.Json2Bundle(elements);

    Iterator<String> domIDs = elementsBundle.keySet().iterator();
    RectF rectF;
    String domId;
    Bundle domInfo, size;
    while (domIDs.hasNext()) {
      domId = domIDs.next();
      domInfo = elementsBundle.getBundle(domId);

      rectF = new RectF();
      size = domInfo.getBundle("size");

      rectF = new RectF();
      rectF.left = (float)(size.getDouble("left") * zoomScale);
      rectF.top = (float)(size.getDouble("top") * zoomScale);
      rectF.right = rectF.left  + (float)(size.getDouble("width") * zoomScale);
      rectF.bottom = rectF.top  + (float)(size.getDouble("height") * zoomScale);
      newBufferRectFs.put(domId, rectF);

      domInfo.remove("size");
      domInfo.putBoolean("isDummy", false);
      newBuffer.put(domId, domInfo);
    }

    HashMap<String, Bundle> oldBuffer = HTMLNodes;
    HashMap<String, RectF> oldBufferRectFs = HTMLNodeRectFs;
    HTMLNodes = newBuffer;
    HTMLNodeRectFs = newBufferRectFs;

    if (needUpdatePosition) {
      return;
    }

    double prevOffsetX, prevOffsetY, newOffsetX, newOffsetY;
    Iterator<String> mapIDs = pluginMaps.keySet().iterator();
    String mapId, mapDivId;
    PluginMap pluginMap;
    Bundle prevDomInfo;
    while(mapIDs.hasNext()) {
      mapId = mapIDs.next();
      pluginMap = pluginMaps.get(mapId);
      if (pluginMap.mapDivId == null) {
        needUpdatePosition = true;
        stopFlag = false;
        break;
      }

      prevDomInfo = oldBuffer.get(pluginMap.mapDivId);
      if (prevDomInfo == null) {
        needUpdatePosition = true;
        stopFlag = false;
        break;
      }

      domInfo = newBuffer.get(pluginMap.mapDivId);
      if (domInfo == null) {
        needUpdatePosition = true;
        stopFlag = false;
        break;
      }

      prevOffsetX = prevDomInfo.getDouble("offsetX");
      prevOffsetY = prevDomInfo.getDouble("offsetY");
      newOffsetX = domInfo.getDouble("offsetX");
      newOffsetY = domInfo.getDouble("offsetY");
      if (prevOffsetX != newOffsetX || prevOffsetY != newOffsetY ) {
        needUpdatePosition = true;
        stopFlag = false;
        break;
      }

    }
    newBuffer = null;
    oldBuffer = null;
  }

  
  public void updateViewPosition(final String mapId) {
    //Log.d("MyPluginLayout", "---> updateViewPosition / mapId = " + mapId);

    if (!pluginMaps.containsKey(mapId)) {
      return;
    }


    mActivity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        PluginMap pluginMap = pluginMaps.get(mapId);
        if (pluginMap.mapDivId == null) {
          return;
        }
        ViewGroup.LayoutParams lParams = pluginMap.mapView.getLayoutParams();
        //int scrollX = browserView.getScrollX();
        int scrollY = browserView.getScrollY();
        int webviewWidth = browserView.getWidth();
        int webviewHeight = browserView.getHeight();
        RectF drawRect = HTMLNodeRectFs.get(pluginMap.mapDivId);

        if (lParams instanceof AbsoluteLayout.LayoutParams) {
          AbsoluteLayout.LayoutParams params = (AbsoluteLayout.LayoutParams) lParams;
          params.width = (int) drawRect.width();
          params.height = (int) drawRect.height();
          params.x = (int) drawRect.left;
          params.y = (int) drawRect.top + scrollY;
          pluginMap.mapView.setLayoutParams(params);
        } else if (lParams instanceof LinearLayout.LayoutParams) {
          LinearLayout.LayoutParams params = (LinearLayout.LayoutParams) lParams;
          params.width = (int) drawRect.width();
          params.height = (int) drawRect.height();
          params.topMargin = (int) drawRect.top + scrollY;
          params.leftMargin = (int) drawRect.left;
          pluginMap.mapView.setLayoutParams(params);
        } else if (lParams instanceof FrameLayout.LayoutParams) {
          FrameLayout.LayoutParams params = (FrameLayout.LayoutParams) lParams;
          params.width = (int) drawRect.width();
          params.height = (int) drawRect.height();
          params.topMargin = (int) drawRect.top + scrollY;
          params.leftMargin = (int) drawRect.left;
          params.gravity = Gravity.TOP;
          pluginMap.mapView.setLayoutParams(params);
        }
        //Log.d("MyPluginLayout", "---> mapId : " + mapId + " drawRect = " + drawRect.left + ", " + drawRect.top);

        if ((drawRect.top + drawRect.height() < 0) ||
          (drawRect.top >  webviewHeight) ||
          (drawRect.left + drawRect.width() < 0) ||
          (drawRect.left > webviewWidth))  {

          pluginMap.mapView.setVisibility(View.INVISIBLE);
        } else {
          pluginMap.mapView.setVisibility(View.VISIBLE);
        }
        frontLayer.invalidate();
      }
    });
  }


  public void setDebug(final boolean debug) {
    this.isDebug = debug;
    mActivity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        if (debug) {
          inValidate();
        }
      }
    });
  }

  public void removePluginMap(final String mapId) {
    if (!pluginMaps.containsKey(mapId)) {
      return;
    }

    mActivity.runOnUiThread(new Runnable() {
      @Override
      public void run() {
        try {
          PluginMap pluginMap = pluginMaps.remove(mapId);
          scrollFrameLayout.removeView(pluginMap.mapView);
          pluginMap.mapView.removeView(touchableWrappers.remove(mapId));

          //Log.d("MyPluginLayout", "--> removePluginMap / mapId = " + mapId);


          mActivity.getWindow().getDecorView().requestFocus();
        } catch (Exception e) {
          // ignore
          //e.printStackTrace();
        }
      }
    });
  }
  
  public void addPluginMap(final PluginMap pluginMap) {
    if (pluginMap.mapDivId == null) {
      return;
    }

    if (!HTMLNodes.containsKey(pluginMap.mapDivId)) {
      Bundle dummyInfo = new Bundle();
      dummyInfo.putDouble("offsetX", 0);
      dummyInfo.putDouble("offsetY", 3000);
      dummyInfo.putBoolean("isDummy", true);
      HTMLNodes.put(pluginMap.mapDivId, dummyInfo);
      HTMLNodeRectFs.put(pluginMap.mapDivId, new RectF(0, 3000, 50, 50));
    }
    pluginMaps.put(pluginMap.mapId, pluginMap);

    mActivity.runOnUiThread(new Runnable() {
      @Override
      public void run() {

        TouchableWrapper wrapper = new TouchableWrapper(context);
        touchableWrappers.put(pluginMap.mapId, wrapper);
        pluginMap.mapView.addView(wrapper);
        scrollFrameLayout.addView(pluginMap.mapView);

        mActivity.getWindow().getDecorView().requestFocus();

        updateViewPosition(pluginMap.mapId);

      }
    });
  }

  public void scrollTo(int x, int y) {
    this.scrollView.scrollTo(x, y);
  }

  public void inValidate() {
    this.frontLayer.invalidate();
  }

  @Override
  public void onScrollChanged() {

    int scrollX = scrollView.getScrollX();
    int scrollY = scrollView.getScrollY();

    Set<String> mapIds = pluginMaps.keySet();
    RectF rectF;
    PluginMap pluginMap;
    String[] mapIdArray= mapIds.toArray(new String[mapIds.size()]);
    for (String mapId : mapIdArray) {
      pluginMap = pluginMaps.get(mapId);
      if (pluginMap.mapDivId == null) {
        continue;
      }
      updateViewPosition(mapId);
      /*
      rectF = HTMLNodeRectFs.get(pluginMap.mapDivId);
      rectF.left -= scrollX;
      rectF.top -= scrollY;
      rectF.right = rectF.left + rectF.width() - scrollX;
      rectF.bottom = rectF.top + rectF.height() - scrollY;

      pluginMap.mapView.set
      */
    }
  }


  private class FrontLayerLayout extends FrameLayout {
    
    public FrontLayerLayout(Context context) {
      super(context);
      this.setWillNotDraw(false);
    }
    
    @Override
    public boolean onInterceptTouchEvent(MotionEvent event) {
      MyPluginLayout.this.stopFlag = true;

      int action = event.getAction();
      //Log.d("FrontLayerLayout", "----> action = " + MotionEvent.actionToString(action) + ", isScrolling = " + isScrolling);

      // The scroll action that started in the browser region is end.
      isScrolling = action != MotionEvent.ACTION_UP && isScrolling;
      if (isScrolling) {
        MyPluginLayout.this.stopFlag = false;
        return false;
      }

      PluginMap pluginMap;
      Iterator<Map.Entry<String, PluginMap>> iterator =  pluginMaps.entrySet().iterator();
      Entry<String, PluginMap> entry;
      String mapId;

      PointF clickPoint = new PointF(event.getX(), event.getY());

      int scrollY = browserView.getScrollY();
      RectF drawRect;
      boolean isMapAction = false;


      while(iterator.hasNext()) {
        entry = iterator.next();
        mapId = entry.getKey();
        pluginMap = entry.getValue();

        //-----------------------
        // Is the map clickable?
        //-----------------------
        if (!pluginMap.isVisible || !pluginMap.isClickable) {
          continue;
        }

        if (pluginMap.mapDivId == null) {
          continue;
        }
        //-----------------------
        // TODO: Is the map displayed?
        //-----------------------
        //if (rect.origin.y + rect.size.height < offsetY ||
        //    rect.origin.x + rect.size.width < offsetX ||
        //    rect.origin.y > offsetY + webviewHeight ||
        //    rect.origin.x > offsetX + webviewWidth ||
        //    mapCtrl.view.hidden == YES) {
        //  //NSLog(@"--> map (%@) is not displayed.", mapCtrl.mapId);
        //  continue;
        //}

        //------------------------------------------------
        // Is the clicked point is in the map rectangle?
        //------------------------------------------------
        drawRect = HTMLNodeRectFs.get(pluginMap.mapDivId);
        if (!drawRect.contains(clickPoint.x, clickPoint.y)) {
          continue;
        }
        isMapAction = true;

        //-----------------------------------------------------------
        // Is the clicked point is on the html elements in the map?
        //-----------------------------------------------------------
        if (MyPluginLayout.this.HTMLNodes.containsKey(mapId)) {
          String domIDs[] = HTMLNodes.keySet().toArray(new String[HTMLNodes.size()]);
          Bundle domInfo = HTMLNodes.get(pluginMap.mapDivId);
          RectF htmlElementRect;
          int mapDivDepth = domInfo.getInt("depth");

          for (String domId : domIDs) {
            if (pluginMap.mapDivId.equals(domId)) {
              continue;
            }
            if (!HTMLNodes.containsKey(domId)) {
              continue;
            }
            domInfo = HTMLNodes.get(domId);
            if (domInfo == null) {
              continue;
            }
            if (domInfo.getInt("depth") < mapDivDepth) {
              continue;
            }

            htmlElementRect = HTMLNodeRectFs.get(domId);
            if (htmlElementRect.width() == 0 || htmlElementRect.height() == 0) {
              continue;
            }

            if (clickPoint.x >= htmlElementRect.left &&
                clickPoint.x <= (htmlElementRect.right) &&
                clickPoint.y >= htmlElementRect.top &&
                clickPoint.y <= htmlElementRect.bottom) {
              isMapAction = false;
              break;
            }
          }

        }
        if (isMapAction) {
          break;
        }
      }
      isScrolling = (!isMapAction && action == MotionEvent.ACTION_DOWN) || isScrolling;
      isMapAction = !isScrolling && isMapAction;

      if (!isMapAction) {
        browserView.requestFocus(View.FOCUS_DOWN);
      }

      MyPluginLayout.this.stopFlag = false;
      return isMapAction;
    }

    @Override
    protected void onDraw(Canvas canvas) {
      if (HTMLNodes.isEmpty() || !isDebug) {
        return;
      }
      int width = canvas.getWidth();
      int height = canvas.getHeight();
      int scrollY = browserView.getScrollY();

      PluginMap pluginMap;
      Iterator<Map.Entry<String, PluginMap>> iterator =  pluginMaps.entrySet().iterator();
      Entry<String, PluginMap> entry;
      String mapId;
      RectF mapRect;
      while(iterator.hasNext()) {
        entry = iterator.next();
        mapId = entry.getKey();
        pluginMap = entry.getValue();
        if (pluginMap.mapDivId == null) {
          continue;
        }
        mapRect = HTMLNodeRectFs.get(pluginMap.mapDivId);

        debugPaint.setColor(Color.argb(100, 0, 255, 0));
        canvas.drawRect(mapRect, debugPaint);

      }


    }
  }
  
  private class TouchableWrapper extends FrameLayout {
    
    public TouchableWrapper(Context context) {
      super(context);
    }

    @Override
    public boolean dispatchTouchEvent(MotionEvent event) {
      int action = event.getAction();
      if (action == MotionEvent.ACTION_DOWN || action == MotionEvent.ACTION_UP) {
        scrollView.requestDisallowInterceptTouchEvent(true);
      }
      return super.dispatchTouchEvent(event);
    }
  } 
}
