//
//  DummyView.m
//  DevApp
//
//  Created by masashi on 8/13/14.
//
//

#import "MyPluginLayer.h"

@implementation MyPluginLayer

- (id)initWithWebView:(UIWebView *)webView {
    self = [super initWithFrame:webView.frame];
    self.webView = webView;
    self.opaque = NO;
    [self.webView removeFromSuperview];

    self.pluginScrollView = [[MyPluginScrollView alloc] initWithFrame:self.webView.frame];
  
    self.pluginScrollView.debugView.webView = self.webView;
    self.pluginScrollView.debugView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
  
    self.pluginScrollView.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
    self.webView.scrollView.delegate = self;
    [self.pluginScrollView setContentSize:CGSizeMake(320, 960) ];
  
    [self addSubview:self.pluginScrollView];
    [self addSubview:self.webView];

  return self;
}

- (void)scrollViewDidScroll:(UIScrollView *)scrollView {
    CGPoint offset = self.pluginScrollView.contentOffset;
    offset.x = self.webView.scrollView.contentOffset.x;
    offset.y = self.webView.scrollView.contentOffset.y;
    [self.pluginScrollView setContentOffset:offset];
  
    float webviewWidth = self.webView.frame.size.width;
    float webviewHeight = self.webView.frame.size.height;
    
    CGFloat zoomScale = self.webView.scrollView.zoomScale;
    
    CGRect rect;
    NSEnumerator *mapIDs = [self.pluginScrollView.debugView.drawRects keyEnumerator];
    GoogleMapsViewController *mapCtrl;
    id mapId;
    //NSLog(@"--> point = %f, %f", point.x, point.y);
    while(mapId = [mapIDs nextObject]) {
        rect = CGRectFromString([self.pluginScrollView.debugView.drawRects objectForKey:mapId]);
        rect.origin.x *= zoomScale;
        rect.origin.y *= zoomScale;
        rect.size.width *= zoomScale;
        rect.size.height *= zoomScale;
        mapCtrl = [self.pluginScrollView.debugView.mapCtrls objectForKey:mapId];
      
          
        // Is the map is displayed?
        if (rect.origin.y + rect.size.height >= offset.y &&
            rect.origin.x + rect.size.width >= offset.x &&
            rect.origin.y < offset.y + webviewHeight &&
            rect.origin.x < offset.x + webviewWidth &&
            mapCtrl.view.hidden == NO) {
          
            // Attach the map view to the parent.
            if (mapCtrl.isRenderedAtOnce == YES ||
                (mapCtrl.map.mapType != kGMSTypeSatellite &&
                mapCtrl.map.mapType != kGMSTypeHybrid)) {
                [self.pluginScrollView attachView:mapCtrl.view];
            }
          
        } else {
            // Detach from the parent view
            if (mapCtrl.isRenderedAtOnce == YES ||
                (mapCtrl.map.mapType != kGMSTypeSatellite &&
                mapCtrl.map.mapType != kGMSTypeHybrid)) {
                
                //[self.pluginScrollView addSubview:mapCtrl.view];
                [mapCtrl.view removeFromSuperview];
            }
        }
      
    }
    if (self.pluginScrollView.debugView.debuggable) {
        [self.pluginScrollView.debugView setNeedsDisplay];
    }
}

- (void)putHTMLElements:(NSDictionary *)elementsDic {
    CGRect rect = CGRectMake(0, 0, 0, 0);
    NSDictionary *domInfo, *size;
    for (NSString *domId in elementsDic) {
        domInfo = [elementsDic objectForKey:domId];
        size = [domInfo objectForKey:@"size"];
        rect.origin.x = [[size objectForKey:@"left"] doubleValue];
        rect.origin.y = [[size objectForKey:@"top"] doubleValue];
        rect.size.width = [[size objectForKey:@"width"] doubleValue];
        rect.size.height = [[size objectForKey:@"height"] doubleValue];
        [domInfo setValue:NSStringFromCGRect(rect) forKey:@"size"];
      
        [self.pluginScrollView.debugView.HTMLNodes setObject:domInfo forKey:domId];
    }
}

- (void)putHTMLElement:domId domInfo:(NSDictionary *)domInfo {
    CGRect rect = CGRectMake(0, 0, 0, 0);
    NSDictionary *size = [domInfo objectForKey:@"size"];
    rect.origin.x = [[size objectForKey:@"left"] doubleValue];
    rect.origin.y = [[size objectForKey:@"top"] doubleValue];
    rect.size.width = [[size objectForKey:@"width"] doubleValue];
    rect.size.height = [[size objectForKey:@"height"] doubleValue];
    [domInfo setValue:NSStringFromCGRect(rect) forKey:@"size"];
  
    [self.pluginScrollView.debugView.HTMLNodes setObject:domInfo forKey:domId];
    
    // invite drawRect();
    //[self setNeedsDisplay];
}
- (void)removeHTMLElement:domId {
    NSMutableDictionary *domInfo = [self.pluginScrollView.debugView.HTMLNodes objectForKey:domId];
    if (!domInfo) {
        return;
    }
    
    [self.pluginScrollView.debugView.HTMLNodes  removeObjectForKey:domId];
    
    // invite drawRect();
    //[self setNeedsDisplay];
}
- (void)clearHTMLElement:(NSString *)mapId {
    NSMutableDictionary *domDic = [self.pluginScrollView.debugView.HTMLNodes objectForKey:mapId];
    if (!domDic) {
        return;
    }
    [domDic removeAllObjects];
    [self.pluginScrollView.debugView.HTMLNodes removeObjectForKey:mapId];
    domDic = nil;
    
    // invite drawRect();
    [self setNeedsDisplay];
}

- (void)addMapView:(NSString *)mapId mapCtrl:(GoogleMapsViewController *)mapCtrl {
  
  
  // Hold mapCtrl instance with mapId.
  [self.pluginScrollView.debugView.mapCtrls setObject:mapCtrl forKey:mapId];
  
  // Hold the size and position information of the mapView.
  NSString *rectStr = NSStringFromCGRect(mapCtrl.view.frame);
  [self.pluginScrollView.debugView.drawRects setObject:rectStr forKey:mapId];
  
  // Add the mapView under this view.
  //[self.pluginScrollView addSubview: mapCtrl.view];
  [self.pluginScrollView attachView:mapCtrl.view];
  
}


- (void)updateViewPosition:(NSString *)mapId {
    CGFloat zoomScale = self.webView.scrollView.zoomScale;
  
    CGPoint offset = self.pluginScrollView.contentOffset;
    offset.x = self.webView.scrollView.contentOffset.x;
    offset.y = self.webView.scrollView.contentOffset.y;
    [self.pluginScrollView setContentOffset:offset];
  
    GoogleMapsViewController *mapCtrl = [self.pluginScrollView.debugView.mapCtrls objectForKey:mapId];
  
    NSDictionary *domInfo = [self.pluginScrollView.debugView.drawRects objectForKey:mapId];
    NSString *rectStr = [domInfo objectForKey:@"size"];
    [self.pluginScrollView.debugView.drawRects setObject:rectStr forKey:mapId];
    
    CGRect rect = CGRectFromString(rectStr);
    rect.origin.x *= zoomScale;
    rect.origin.y *= zoomScale;
    rect.size.width *= zoomScale;
    rect.size.height *= zoomScale;
  
    float webviewWidth = self.webView.frame.size.width;
    float webviewHeight = self.webView.frame.size.height;
  
    // Is the map is displayed?
    if (rect.origin.y + rect.size.height >= offset.y &&
        rect.origin.x + rect.size.width >= offset.x &&
        rect.origin.y < offset.y + webviewHeight &&
        rect.origin.x < offset.x + webviewWidth &&
        mapCtrl.view.hidden == NO) {
      
        // Attach the map view to the parent.
        if (mapCtrl.isRenderedAtOnce == YES ||
            (mapCtrl.map.mapType != kGMSTypeSatellite &&
            mapCtrl.map.mapType != kGMSTypeHybrid)) {
            
            [self.pluginScrollView attachView:mapCtrl.view];
        }
      
    } else {
        // Detach from the parent view
        if (mapCtrl.isRenderedAtOnce == YES ||
            (mapCtrl.map.mapType != kGMSTypeSatellite &&
            mapCtrl.map.mapType != kGMSTypeHybrid)) {
            
            //[self.pluginScrollView addSubview:mapCtrl.view];
            [mapCtrl.view removeFromSuperview];
        }
    }

    mapCtrl.isRenderedAtOnce = YES;

    [mapCtrl.view setFrame:rect];
    
    if (self.pluginScrollView.debugView.debuggable) {
        [self.pluginScrollView.debugView setNeedsDisplay];
    }
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event {

    float offsetX = self.webView.scrollView.contentOffset.x;
    float offsetY = self.webView.scrollView.contentOffset.y;
    float offsetX2 = self.webView.scrollView.contentOffset.x;
    float offsetY2 = self.webView.scrollView.contentOffset.y;
  
    float webviewWidth = self.webView.frame.size.width;
    float webviewHeight = self.webView.frame.size.height;
  
    
    CGRect rect, htmlElementRect= CGRectMake(0, 0, 0, 0);
    NSEnumerator *mapIDs = [self.pluginScrollView.debugView.drawRects keyEnumerator];
    GoogleMapsViewController *mapCtrl;
    id mapId;
    BOOL isMapAction = NO;
    NSString *elementRect;
  
    CGFloat zoomScale = self.webView.scrollView.zoomScale;
    offsetY *= zoomScale;
    offsetX *= zoomScale;
    webviewWidth *= zoomScale;
    webviewHeight *= zoomScale;
  
    NSDictionary *domInfo, *mapDivInfo;
    int domDepth, mapDivDepth;
  
    CGPoint clickPointAsHtml = CGPointMake(point.x * zoomScale, point.y * zoomScale);
  
    while(mapId = [mapIDs nextObject]) {
        rect = CGRectFromString([self.pluginScrollView.debugView.drawRects objectForKey:mapId]);
        rect.origin.x *= zoomScale;
        rect.origin.y *= zoomScale;
        rect.size.width *= zoomScale;
        rect.size.height *= zoomScale;
        mapCtrl = [self.pluginScrollView.debugView.mapCtrls objectForKey:mapId];
        //NSLog(@"--> rect = %f, %f - %f, %f", rect.origin.x, rect.origin.y, rect.size.width, rect.size.height);
        
        // Is the map clickable?
        if (mapCtrl.clickable == NO) {
          //NSLog(@"--> map (%@) is not clickable.", mapCtrl.mapId);
          continue;
        }

        // Is the map displayed?
        if (rect.origin.y + rect.size.height < offsetY ||
            rect.origin.x + rect.size.width < offsetX ||
            rect.origin.y > offsetY + webviewHeight ||
            rect.origin.x > offsetX + webviewWidth ||
            mapCtrl.view.hidden == YES) {
            //NSLog(@"--> map (%@) is not displayed.", mapCtrl.mapId);
            continue;
        }
      
        // Is the clicked point is in the map rectangle?
        if ((point.x + offsetX2) >= rect.origin.x && (point.x + offsetX2) <= (rect.origin.x + rect.size.width) &&
            (point.y + offsetY2) >= rect.origin.y && (point.y + offsetY2) <= (rect.origin.y + rect.size.height)) {
            isMapAction = YES;
        } else {
            //NSLog(@"--> point = %f, %f are not in the map.", point.x, point.y);
            continue;
        }

        // Is the clicked point is on the html elements in the map?
        mapDivInfo = [self.pluginScrollView.debugView.HTMLNodes objectForKey:mapCtrl.mapDivId];
        mapDivDepth = [[mapDivInfo objectForKey:@"depth"] intValue];
      
        for (NSString *domId in self.pluginScrollView.debugView.HTMLNodes) {
            if ([mapCtrl.mapDivId isEqualToString:domId]) {
                NSLog(@"--> skip (%@) ", mapCtrl.mapId);
                continue;
            }
          
            domInfo = [self.pluginScrollView.debugView.HTMLNodes objectForKey:domId];
            domDepth = [[domInfo objectForKey:@"depth"] intValue];
            if (domDepth < mapDivDepth) {
                NSLog(@"--> skip (domId: %@, depth: %d) < (mapId: %@, depth: %d)", domId, domDepth, mapCtrl.mapId, mapDivDepth);
                continue;
            }
            elementRect = [domInfo objectForKey:@"size"];
            htmlElementRect = CGRectFromString(elementRect);
            if (htmlElementRect.size.width == 0 || htmlElementRect.size.height == 0) {
                continue;
            }
          
            if (![[domInfo objectForKey:@"position"] isEqualToString:@"fixed"]) {
                htmlElementRect.origin.x -= offsetX;
                htmlElementRect.origin.y -= offsetY;
            }



          
            NSLog(@"----> domId = %@, %f, %f - %f, %f", domId, htmlElementRect.origin.x, htmlElementRect.origin.y, htmlElementRect.size.width, htmlElementRect.size.height);
            if (clickPointAsHtml.x >= htmlElementRect.origin.x && clickPointAsHtml.x <= (htmlElementRect.origin.x + htmlElementRect.size.width) &&
                clickPointAsHtml.y >= htmlElementRect.origin.y && clickPointAsHtml.y <= (htmlElementRect.origin.y + htmlElementRect.size.height)) {
                isMapAction = NO;
                NSLog(@"--> hit (%@) : (domId: %@, depth: %d) ", mapCtrl.mapId, domId, domDepth);
                break;
            }
          
        }

        if (isMapAction == NO) {
            continue;
        }
      
        // If user click on the map, return the mapCtrl.view.
        offsetX = (mapCtrl.view.frame.origin.x * zoomScale) - offsetX;
        offsetY = (mapCtrl.view.frame.origin.y * zoomScale) - offsetY;
        CGPoint point2 = CGPointMake(point.x * zoomScale, point.y * zoomScale);
        point2.x -= offsetX;
        point2.y -= offsetY;

        UIView *hitView =[mapCtrl.view hitTest:point2 withEvent:event];
        //NSLog(@"--> (hit test) point = %f, %f / hit = %@", clickPointAsHtml.x, clickPointAsHtml.y,  hitView.class);
      
        /*
          TODO: Does this code still need for Google Maps? Check it out later.
         
        NSString *hitClass = [NSString stringWithFormat:@"%@", [hitView class]];
        if ([PluginUtil isIOS7_OR_OVER] &&
            [hitClass isEqualToString:@"UIButton"] &&
            mapCtrl.map.isMyLocationEnabled &&
            (point.x  + offsetX2) >= (rect.origin.x + rect.size.width - 50) &&
            (point.y + offsetY2) >= (rect.origin.y + rect.size.height - 50)) {

            BOOL retValue = [mapCtrl didTapMyLocationButtonForMapView:mapCtrl.map];
            if (retValue == YES) {
                return nil;
            }
        }
        */
        return hitView;
    }
    return [super hitTest:point withEvent:event];
}


@end
