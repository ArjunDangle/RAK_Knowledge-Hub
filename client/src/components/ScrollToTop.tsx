import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * This component ensures that the window is scrolled to the top
 * every time the user navigates to a new route.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component does not render anything to the DOM.
}