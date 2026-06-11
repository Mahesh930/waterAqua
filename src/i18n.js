import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "welcome": "Welcome back",
      "live_tracking": "Live Tracking",
      "order_water": "Order Water Jars",
      "my_orders": "My Orders",
      "active_deliveries": "Active Deliveries",
      "all_orders": "All Orders",
    }
  },
  hi: {
    translation: {
      "welcome": "स्वागत है",
      "live_tracking": "लाइव ट्रैकिंग",
      "order_water": "पानी के जार ऑर्डर करें",
      "my_orders": "मेरे ऑर्डर्स",
      "active_deliveries": "सक्रिय डिलीवरी",
      "all_orders": "सभी ऑर्डर्स",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
