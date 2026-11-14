/* =========================================================================
   Calendar settings

   1. In Google Calendar, make a calendar just for this page
      (Settings > Add calendar > Create new calendar), e.g. "Office hours & talks".
      Don't use your main calendar: everything on it becomes public.
   2. In that calendar's settings, under "Access permissions for events",
      turn on "Make available to public". "See all event details" shows titles;
      "See only free/busy" shows times only.
   3. Under "Integrate calendar", copy the Calendar ID into `id` below.

   That's all it needs. With just the ID, the page shows Google's calendar,
   darkened to fit the site.

   Optional: for the site's own look (list + month views), make a Google API key
   with the Google Calendar API turned on, restrict it to harrisonpstewart.com/*,
   and paste it into `apiKey`. If the key ever stops working, the page falls back
   to Google's calendar on its own.
   ========================================================================= */
window.CALENDAR = {
  id: "",
  apiKey: "",
  timeZone: "America/Denver",
};
