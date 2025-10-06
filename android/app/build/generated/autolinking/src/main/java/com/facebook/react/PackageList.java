package com.facebook.react;

import android.app.Application;
import android.content.Context;
import android.content.res.Resources;

import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainPackageConfig;
import com.facebook.react.shell.MainReactPackage;
import java.util.Arrays;
import java.util.ArrayList;

// react-native-vector-icons
import com.oblador.vectoricons.VectorIconsPackage;
// @bam.tech/react-native-image-resizer
import com.reactnativeimageresizer.ImageResizerPackage;
// @d11/react-native-fast-image
import com.dylanvann.fastimage.FastImageViewPackage;
// @dr.pogodin/react-native-fs
import com.drpogodin.reactnativefs.ReactNativeFsPackage;
// @mitch528/react-native-grpc
import com.reactnativegrpc.GrpcPackage;
// @notifee/react-native
import io.invertase.notifee.NotifeePackage;
// @react-native-async-storage/async-storage
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;
// @react-native-camera-roll/camera-roll
import com.reactnativecommunity.cameraroll.CameraRollPackage;
// @react-native-clipboard/clipboard
import com.reactnativecommunity.clipboard.ClipboardPackage;
// @react-native-community/blur
import com.reactnativecommunity.blurview.BlurViewPackage;
// @react-native-community/netinfo
import com.reactnativecommunity.netinfo.NetInfoPackage;
// @react-native-community/slider
import com.reactnativecommunity.slider.ReactSliderPackage;
// @react-native-documents/picker
import com.reactnativedocumentpicker.RNDocumentPickerPackage;
// @react-native-firebase/analytics
import io.invertase.firebase.analytics.ReactNativeFirebaseAnalyticsPackage;
// @react-native-firebase/app
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
// @react-native-firebase/crashlytics
import io.invertase.firebase.crashlytics.ReactNativeFirebaseCrashlyticsPackage;
// @react-native-firebase/database
import io.invertase.firebase.database.ReactNativeFirebaseDatabasePackage;
// @react-native-firebase/firestore
import io.invertase.firebase.firestore.ReactNativeFirebaseFirestorePackage;
// @react-native-firebase/functions
import io.invertase.firebase.functions.ReactNativeFirebaseFunctionsPackage;
// @react-native-firebase/messaging
import io.invertase.firebase.messaging.ReactNativeFirebaseMessagingPackage;
// @react-native-firebase/perf
import io.invertase.firebase.perf.ReactNativeFirebasePerfPackage;
// @react-native-firebase/storage
import io.invertase.firebase.storage.ReactNativeFirebaseStoragePackage;
// @react-native-masked-view/masked-view
import org.reactnative.maskedview.RNCMaskedViewPackage;
// @sentry/react-native
import io.sentry.react.RNSentryPackage;
// @shopify/flash-list
import com.shopify.reactnative.flash_list.ReactNativeFlashListPackage;
// lottie-react-native
import com.airbnb.android.react.lottie.LottiePackage;
// react-native-biometrics
import com.rnbiometrics.ReactNativeBiometricsPackage;
// react-native-bootsplash
import com.zoontek.rnbootsplash.RNBootSplashPackage;
// react-native-compressor
import com.reactnativecompressor.CompressorPackage;
// react-native-contacts
import com.rt2zz.reactnativecontacts.ReactNativeContacts;
// react-native-context-menu-view
import com.mpiannucci.reactnativecontextmenu.ContextMenuPackage;
// react-native-create-thumbnail
import com.reactlibrary.createthumbnail.CreateThumbnailPackage;
// react-native-device-country
import com.reactnativedevicecountry.DeviceCountryPackage;
// react-native-device-info
import com.learnium.RNDeviceInfo.RNDeviceInfo;
// react-native-file-viewer
import com.vinzscam.reactnativefileviewer.RNFileViewerPackage;
// react-native-gesture-handler
import com.swmansion.gesturehandler.RNGestureHandlerPackage;
// react-native-get-random-values
import org.linusu.RNGetRandomValuesPackage;
// react-native-haptic-feedback
import com.mkuczera.RNReactNativeHapticFeedbackPackage;
// react-native-image-crop-picker
import com.reactnative.ivpusic.imagepicker.PickerPackage;
// react-native-keychain
import com.oblador.keychain.KeychainPackage;
// react-native-linear-gradient
import com.BV.LinearGradient.LinearGradientPackage;
// react-native-mmkv
import com.mrousavy.mmkv.MmkvPackage;
// react-native-otp-verify
import com.faizal.OtpVerify.OtpVerifyPackage;
// react-native-pager-view
import com.reactnativepagerview.PagerViewPackage;
// react-native-permissions
import com.zoontek.rnpermissions.RNPermissionsPackage;
// react-native-reanimated
import com.swmansion.reanimated.ReanimatedPackage;
// react-native-safe-area-context
import com.th3rdwave.safeareacontext.SafeAreaContextPackage;
// react-native-screens
import com.swmansion.rnscreens.RNScreensPackage;
// react-native-share
import cl.json.RNSharePackage;
// react-native-sms-retriever
import me.furtado.smsretriever.RNSmsRetrieverPackage;
// react-native-svg
import com.horcrux.svg.SvgPackage;
// react-native-video
import com.brentvatne.react.ReactVideoPackage;
// react-native-webview
import com.reactnativecommunity.webview.RNCWebViewPackage;
// realm
import io.realm.react.RealmReactPackage;

public class PackageList {
  private Application application;
  private ReactNativeHost reactNativeHost;
  private MainPackageConfig mConfig;

  public PackageList(ReactNativeHost reactNativeHost) {
    this(reactNativeHost, null);
  }

  public PackageList(Application application) {
    this(application, null);
  }

  public PackageList(ReactNativeHost reactNativeHost, MainPackageConfig config) {
    this.reactNativeHost = reactNativeHost;
    mConfig = config;
  }

  public PackageList(Application application, MainPackageConfig config) {
    this.reactNativeHost = null;
    this.application = application;
    mConfig = config;
  }

  private ReactNativeHost getReactNativeHost() {
    return this.reactNativeHost;
  }

  private Resources getResources() {
    return this.getApplication().getResources();
  }

  private Application getApplication() {
    if (this.reactNativeHost == null) return this.application;
    return this.reactNativeHost.getApplication();
  }

  private Context getApplicationContext() {
    return this.getApplication().getApplicationContext();
  }

  public ArrayList<ReactPackage> getPackages() {
    return new ArrayList<>(Arrays.<ReactPackage>asList(
      new MainReactPackage(mConfig),
      new VectorIconsPackage(),
      new ImageResizerPackage(),
      new FastImageViewPackage(),
      new ReactNativeFsPackage(),
      new GrpcPackage(),
      new NotifeePackage(),
      new AsyncStoragePackage(),
      new CameraRollPackage(),
      new ClipboardPackage(),
      new BlurViewPackage(),
      new NetInfoPackage(),
      new ReactSliderPackage(),
      new RNDocumentPickerPackage(),
      new ReactNativeFirebaseAnalyticsPackage(),
      new ReactNativeFirebaseAppPackage(),
      new ReactNativeFirebaseCrashlyticsPackage(),
      new ReactNativeFirebaseDatabasePackage(),
      new ReactNativeFirebaseFirestorePackage(),
      new ReactNativeFirebaseFunctionsPackage(),
      new ReactNativeFirebaseMessagingPackage(),
      new ReactNativeFirebasePerfPackage(),
      new ReactNativeFirebaseStoragePackage(),
      new RNCMaskedViewPackage(),
      new RNSentryPackage(),
      new ReactNativeFlashListPackage(),
      new LottiePackage(),
      new ReactNativeBiometricsPackage(),
      new RNBootSplashPackage(),
      new CompressorPackage(),
      new ReactNativeContacts(),
      new ContextMenuPackage(),
      new CreateThumbnailPackage(),
      new DeviceCountryPackage(),
      new RNDeviceInfo(),
      new RNFileViewerPackage(),
      new RNGestureHandlerPackage(),
      new RNGetRandomValuesPackage(),
      new RNReactNativeHapticFeedbackPackage(),
      new PickerPackage(),
      new KeychainPackage(),
      new LinearGradientPackage(),
      new MmkvPackage(),
      new OtpVerifyPackage(),
      new PagerViewPackage(),
      new RNPermissionsPackage(),
      new ReanimatedPackage(),
      new SafeAreaContextPackage(),
      new RNScreensPackage(),
      new RNSharePackage(),
      new RNSmsRetrieverPackage(),
      new SvgPackage(),
      new ReactVideoPackage(),
      new RNCWebViewPackage(),
      new RealmReactPackage()
    ));
  }
}