//
//  GMSCoordinateBounds+Geometry.h
//
//  Created by Marius Feldmann on 8/12/14.
//  Copyright (c) 2014 Marius Feldmann. All rights reserved.
//

//#import <GoogleMaps/GoogleMaps.h>
#import <AMapNaviKit/MAMapKit.h>

//macro from: https://medium.com/@kostiakoval/objective-c-associated-objects-8896854c681b
//github: https://github.com/kostiakoval/NSObject-Associated/blob/master/NSObject-Associated/KKNSObject%2BAssociated.h

/**
 * A macro that creates getter and setter for your assosiated object
 *
 * @param propertyName Getter funtion name
 * @param setter Setter funtion name
 * @param objc_AssociationPolicy Memory policy for assosiated object
 *
 * Available option: OBJC_ASSOCIATION_ASSIGN, OBJC_ASSOCIATION_RETAIN_NONATOMIC, OBJC_ASSOCIATION_COPY_NONATOMIC, OBJC_ASSOCIATION_RETAIN, OBJC_ASSOCIATION_COPY
 *
 */
#import <objc/runtime.h>
#define ASSOCIATED(propertyName, setter, type, objc_AssociationPolicy)\
- (type)propertyName {\
return objc_getAssociatedObject(self, _cmd);\
}\
\
- (void)setter:(type)object\
{\
objc_setAssociatedObject(self, @selector(propertyName), object, objc_AssociationPolicy);\
}

//@interface MACoordinateBounds (MFAdditions)
//
///** The North-West corner of these bounds. */
//- (CLLocationCoordinate2D)southEast;
//
///** The South-East corner of these bounds. */
//- (CLLocationCoordinate2D)northWest;
//
///** The center coordinate of these bounds. */
//- (CLLocationCoordinate2D)center;
//
///** Return the path of the rect. */
////- (GMSPath *)path;
//
///**
// * Returns an NSArray of GMSCoordinateBounds
// * Divides the current rectangular bounding box
// * into |numberOfRects| smaller boxes.
// */
//- (NSArray *)divideIntoNumberOfBoxes:(NSInteger)numberOfBoxesl;
//
//@end


@interface GMSMarkerLayer : NSObject

/**
 Latitude, part of position on GMSMarker.
 */
@property(readwrite, assign) CLLocationDegrees latitude;

/**
 Longitude, part of position on GMSMarker.
 */
@property(readwrite, assign) CLLocationDegrees longitude;

/**
 Rotation, as per GMSMarker.
 */
@property(readwrite, assign) CLLocationDegrees rotation;

/**
 Opacity, as per GMSMarker.
 */
@property(readwrite, assign) float opacity;

@end


@interface MAPointAnnotation (MFAdditions)

/**
 Overlay data.
 You can use this property to associate an arbitrary object with this overlay. Google Maps SDK for iOS neither reads nor writes this property.
 Note that userData should not hold any strong references to any Maps objects, otherwise a retain cycle may be created (preventing objects from being released).
 */
@property(readwrite, assign) id userData;

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

/**
 Provides the Core Animation layer for this MAPointAnnotation.
 */
@property(readwrite, assign) GMSMarkerLayer* layer;

/**
 
 */
@property(readwrite, assign) NSString *snippet;

@end


@interface MACircle (MFAdditions)

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

@end


@interface MAPolyline (MFAdditions)

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

@end


@interface MAPolygon (MFAdditions)

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

@end


@interface MATileOverlay (MFAdditions)

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

@end

@interface MAGroundOverlay (MFAdditions)

/**
 The map this overlay is on.
 Setting this property will add the overlay to the map. Setting it to nil removes this overlay from the map. An overlay may be active on at most one map at any given time.
 */
@property(readwrite, assign) MAMapView* map;

/**
 * Higher zIndex value overlays will be drawn on top of lower zIndex value tile layers and overlays.

Equal values result in undefined draw ordering. Markers are an exception that regardless of zIndex, they will always be drawn above tile layers and other non-marker overlays; they are effectively considered to be in a separate z-index group compared to other overlays.
*/
@property(readwrite, assign) int zIndex;

@end

