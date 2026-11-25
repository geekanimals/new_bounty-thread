/*
 * WhatsApp messages that actually go out now — the Snapto drips (Utility templates).
 * Copied from Snapto → Automation → Drips (18 Nov 2026). If you edit a drip in Snapto, update the text here too.
 * Each drip starts on a Geek OS event and stops when the creator finishes the task (done_* in Snapto).
 * Placeholders: {name} creator first name · {campaign} campaign name · {courier} · {tracking} · {address} · {due} video due date · {ig} Instagram username
 */
export const DRIPS = {
  "01": {
    name: "Campaign invite (bulk)",
    when: "A creator from your bulk sheet who has no Bounty account yet",
    stops: "they register and join the campaign",
    msgs: [
      { after: "10 minutes", text: "Hi {name}, your Bounty account for the {campaign} campaign has been created. To continue, please verify your WhatsApp number and accept the campaign terms.", buttons: ["Verify and continue", "Not interested"] },
      { after: "3 hours", text: "Hi {name}, account update: your registration for the {campaign} campaign is pending. Verification takes about two minutes.", buttons: ["Complete registration", "Not interested"] },
      { after: "20 hours", text: "Account update: your registration for the {campaign} campaign is still pending. Your details are already saved.", buttons: ["Complete registration", "Not interested"] },
    ],
  },
  "01i": {
    name: "Campaign invite with photo (bulk)",
    when: "Same as 01, when the campaign has a JPG / PNG photo (WhatsApp invite photo, else the campaign photo). Templates campaign_invite_pic_1 / _2 / _3",
    stops: "they register and join the campaign",
    msgs: [
      { after: "10 minutes", text: "[campaign photo]\nHi {name}, your Bounty account for the {campaign} campaign is ready. To continue, please verify your WhatsApp number and accept the campaign terms.\n\n@GeekAnimals", buttons: ["Verify and continue", "Not interested"] },
      { after: "3 hours", text: "[campaign photo]\nHi {name}, a quick update on your {campaign} campaign registration: it is still pending. Verifying your number takes about two minutes.\n\n@GeekAnimals", buttons: ["Verify and continue", "Not interested"] },
      { after: "20 hours", text: "[campaign photo]\nAccount update: your registration for the {campaign} campaign is still pending. Your details are already saved.\n\n@GeekAnimals", buttons: ["Verify and continue", "Not interested"] },
    ],
  },
  "01i1": {
    name: "Invite reminder with photo (one message)",
    when: "Sent once from the campaign to creators who were invited but have not joined",
    stops: "sent once",
    msgs: [{ after: "now", text: "[campaign photo]\nHi {name}, a quick update on your {campaign} campaign registration: it is still pending. Verifying your number takes about two minutes.\n\n@GeekAnimals", buttons: ["Verify and continue", "Not interested"] }],
  },
  "02": {
    name: "Profile complete",
    when: "After Instagram is connected (or 4 days of the Instagram drip) and the profile is still not complete",
    stops: "the profile is complete",
    msgs: [
      { after: "5 minutes after Instagram is connected", text: "Thank you for joining Bounty, {name}.\nYour creator account is ready. Please complete your profile to finish setting up your account.", buttons: ["Complete profile", "Not interested"] },
      { after: "3 hours", text: "Thank you for signing up with Bounty, {name}.\nAccount status: profile details pending. You can view and update the pending details in your account.", buttons: ["View pending details", "Not interested"] },
      { after: "20 hours", text: "Thank you for signing up with Bounty, {name}.\nAccount update: your creator profile setup is pending. You can view the pending details in your account.", buttons: ["View account", "Not interested"] },
      { after: "1 day", text: "Thank you for being with Bounty, {name}.\nAccount update: your creator profile setup is still pending. You can view the pending details in your account.", buttons: ["View account", "Not interested"] },
    ],
  },
  "04": {
    name: "Instagram connect",
    when: "A creator signed up but has not connected Instagram",
    stops: "Instagram is connected",
    msgs: [
      { after: "1 hour after sign-up", text: "Thank you for joining Bounty, {name}.\nYour account setup has one pending step: connecting your Instagram account. You can complete this step from your account.", buttons: ["Connect Instagram", "Not interested"] },
      { after: "3 hours", text: "Thank you for being with Bounty, {name}.\nAccount update: your Instagram account link is pending. You can view the pending details in your account.", buttons: ["Link Instagram", "Not interested"] },
      { after: "20 hours", text: "Thank you for your patience, {name}.\nAccount status: Instagram link pending. You can view this step in your account.", buttons: ["Link Instagram", "Not interested"] },
      { after: "1 day", text: "Thank you for your time, {name}.\nAccount update: your Instagram account link is still pending. You can view the pending details in your account.", buttons: ["Link Instagram", "Not interested"] },
    ],
  },
  "05": {
    name: "Instagram sync failed",
    when: "Instagram connected but the first sync failed",
    stops: "Instagram is reconnected",
    msgs: [
      { after: "1 hour", text: "Thank you for connecting your Instagram account with Bounty.\nWe could not finish syncing @{ig}. Your account is safe. Please reconnect Instagram to update your media kit.", buttons: ["Reconnect", "Not interested"] },
      { after: "3 hours", text: "Thank you for your patience.\nThe sync for your Instagram account @{ig} has not completed yet. Please reconnect Instagram from your account to finish the sync.", buttons: ["Reconnect", "Not interested"] },
      { after: "20 hours", text: "Thank you for staying with Bounty.\nYour media kit for @{ig} cannot be updated until Instagram is reconnected. Please reconnect when you have a moment.", buttons: ["Reconnect", "Not interested"] },
      { after: "1 day", text: "Thank you for your time.\nThis is an update on your account: @{ig} is still not synced. Your media kit will update after you reconnect Instagram.", buttons: ["Reconnect", "Not interested"] },
    ],
  },
  "06": {
    name: "Instagram reconnect",
    when: "The Instagram connection expired / needs renewing",
    stops: "Instagram is reconnected",
    msgs: [
      { after: "1 hour", text: "Thank you for using Bounty with your Instagram account.\nThe connection for @{ig} needs attention. Please reconnect to keep your creator insights up to date.", buttons: ["Reconnect", "Not interested"] },
      { after: "3 hours", text: "Thank you for your patience.\nYour Instagram connection for @{ig} still needs to be renewed. Please reconnect to continue.", buttons: ["Reconnect", "Not interested"] },
      { after: "20 hours", text: "Thank you for staying connected with Bounty.\nUntil @{ig} is reconnected, your creator insights cannot be refreshed. Reconnecting takes less than a minute.", buttons: ["Reconnect", "Not interested"] },
      { after: "1 day", text: "Thank you for your time.\nThe connection for @{ig} has still not been renewed. Please reconnect it from your account to continue syncing your data.", buttons: ["Reconnect", "Not interested"] },
    ],
  },
  "10": {
    name: "Contract ready",
    when: "Contract sent to the creator",
    stops: "the contract is signed",
    msgs: [
      { after: "1 hour", text: "Thank you for joining {campaign}.\nYour campaign agreement is ready. Please review the terms carefully before you confirm.", buttons: ["Review agreement", "Not interested"] },
      { after: "3 hours", text: "Thank you for your patience.\nYour agreement for {campaign} is still waiting for your confirmation. Please review it when you can.", buttons: ["Review agreement", "Not interested"] },
      { after: "20 hours", text: "Thank you for being part of {campaign}.\nYour campaign agreement is still pending confirmation. You can review and confirm it in your account.", buttons: ["Review agreement", "Not interested"] },
      { after: "1 day", text: "Thank you for your time.\nYour agreement for {campaign} is still awaiting your confirmation. You can review and confirm it from your account.", buttons: ["Review agreement", "Not interested"] },
    ],
  },
  "12": {
    name: "Address confirm",
    when: "Contract signed — the delivery address needs confirming",
    stops: "the address is confirmed",
    msgs: [
      { after: "1 hour", text: "Thank you for being part of {campaign}.\nBefore we ship your product, please review your delivery address: {address}. If it is correct, tap Confirm address. If not, tap Edit address.", buttons: ["Confirm address", "Edit address"] },
      { after: "3 hours", text: "Thank you for your patience.\nYour delivery address for {campaign} is not confirmed yet: {address}. Please confirm it so that the product can be shipped.", buttons: ["Confirm address", "Edit address"] },
      { after: "20 hours", text: "Thank you for staying with {campaign}.\nThe product cannot be shipped until you confirm your delivery address: {address}. It only takes a moment.", buttons: ["Confirm address", "Edit address"] },
      { after: "1 day", text: "Thank you for your time.\nThis is a final reminder to review and confirm your delivery address for {campaign}: {address}. You can also edit it from your account.", buttons: ["Confirm address", "Edit address"] },
    ],
  },
  "07": {
    name: "Product shipped",
    when: "Courier added — the product is on the way",
    stops: "sent once",
    msgs: [{ after: "1 minute", text: "Thank you, {name}. Your {campaign} product has been shipped. Courier: {courier}. Tracking ID: {tracking}. You can follow the delivery on your campaign page.", buttons: ["Track order"] }],
  },
  "08": {
    name: "Product delivered + video brief",
    when: "The product is delivered — the video brief opens and the deadline starts",
    stops: "the video is uploaded",
    msgs: [
      { after: "5 minutes", text: "Thank you, {name}. Your {campaign} product has been delivered. The video brief is now available on your campaign page.", buttons: ["View brief", "Not interested"] },
      { after: "3 hours", text: "Hi {name}, your video for {campaign} is due on {due}. The brief on your campaign page has the key points and hashtags.", buttons: ["View brief", "Not interested"] },
      { after: "20 hours", text: "Campaign update: your video for {campaign} is due on {due} and has not been uploaded yet.", buttons: ["Upload video", "Not interested"] },
      { after: "1 day", text: "Hi {name}, you can upload your {campaign} video from your campaign page. Reply to this message if you need help with the brief.", buttons: ["Upload video", "Not interested"] },
    ],
  },
  "09": {
    name: "Video due / overdue",
    when: "The video due date is today",
    stops: "the video is uploaded",
    msgs: [
      { after: "5 minutes", text: "Hi {name}, your video for the {campaign} campaign is due today. You can upload it from your campaign page.", buttons: ["Upload video", "Not interested"] },
      { after: "3 hours", text: "Campaign update: the video for {campaign} is now past its due date. Please upload it so the brand can review it.", buttons: ["Upload video", "Not interested"] },
      { after: "20 hours", text: "Hi {name}, your {campaign} video is still pending. If you need more time, reply to this message with a new date.", buttons: ["Upload video", "Not interested"] },
      { after: "1 day", text: "Hi {name}, this is the final update about your {campaign} video. If we do not receive it, this collaboration may be closed.", buttons: ["Upload video", "Not interested"] },
    ],
  },
  "13": {
    name: "Video approved — post",
    when: "The brand approved the video",
    stops: "the post link is added",
    msgs: [
      { after: "5 minutes", text: "Thank you, {name}. Your video for {campaign} has been approved. You can now post it on Instagram and add the post link on your campaign page.", buttons: ["Add post link", "Not interested"] },
      { after: "3 hours", text: "Hi {name}, once your {campaign} video is live on Instagram, please add the post link so we can verify it.", buttons: ["Add post link", "Not interested"] },
      { after: "20 hours", text: "Campaign update: the post link for {campaign} has not been added yet. The campaign is completed once the link is verified.", buttons: ["Add post link", "Not interested"] },
      { after: "1 day", text: "Hi {name}, account update: your {campaign} campaign is waiting for the post link. Once it is added, we will verify it and close the campaign.", buttons: ["Add post link", "Not interested"] },
    ],
  },
  "14": {
    name: "Campaign completed",
    when: "The post is verified — the campaign is complete",
    stops: "sent once",
    msgs: [{ after: "1 minute", text: "Thank you, {name}. Your {campaign} campaign is now complete. Your post has been verified and added to your Bounty profile.", buttons: ["View my campaigns"] }],
  },
  /* Geek OS sends these itself (Snapto Utility templates, timed queue) — the rest stop when the creator does the task */
  P1: {
    name: "Paid video brief",
    when: "Paid campaign: the contract is signed (no product to wait for)",
    stops: "the video is uploaded",
    msgs: [
      { after: "now", text: "Thank you for signing the agreement, {name}. Your video brief for the {campaign} campaign is now ready, and your video is due on {due}.\n\n@GeekAnimals", buttons: ["View brief", "Not interested"] },
      { after: "3 hours", text: "Hi {name}, your video for {campaign} is due on {due}. The brief on your campaign page has the key points and hashtags.", buttons: ["View brief", "Not interested"] },
      { after: "1 day", text: "Campaign update: your video for {campaign} is due on {due} and has not been uploaded yet.", buttons: ["Upload video", "Not interested"] },
      { after: "2 days", text: "Hi {name}, you can upload your {campaign} video from your campaign page. Reply to this message if you need help with the brief.", buttons: ["Upload video", "Not interested"] },
    ],
  },
  L1: {
    name: "Video overdue",
    when: "The video is marked overdue (creator page or bulk sheet)",
    stops: "the video is uploaded or the overdue mark is cleared",
    msgs: [
      { after: "now", text: "Hi {name}, your video for the {campaign} campaign is now overdue. Please upload it today so the brand can review it on time.\n\n@GeekAnimals", buttons: ["Upload video", "Not interested"] },
      { after: "1 day", text: "Campaign update: we have not received your video for {campaign} yet. If you need help with the brief, please reply to this message.\n\n@GeekAnimals", buttons: ["Upload video", "Need more time"] },
      { after: "2 days", text: "Final reminder, {name}: your {campaign} video is still pending. If we do not receive it soon, this collaboration may be closed.\n\n@GeekAnimals", buttons: ["Upload video", "Not interested"] },
    ],
  },
  C1: {
    name: "Changes requested",
    when: "The brand asks for changes in the submitted video",
    stops: "a new video is uploaded",
    msgs: [
      { after: "now", text: "Hi {name}, the brand has reviewed your video for the {campaign} campaign and requested a few changes.\n\nChanges: {note}\n\nPlease upload the updated video from your campaign page.\n\n@GeekAnimals", buttons: ["Upload new video", "Need help"] },
      { after: "1 day", text: "Hi {name}, this is a reminder that the changes to your {campaign} video are still pending. You can see the brand's notes on your campaign page.\n\n@GeekAnimals", buttons: ["Upload new video", "Need help"] },
      { after: "2 days", text: "Campaign update: your updated video for {campaign} has not been uploaded yet. Please upload it so the campaign can move forward.\n\n@GeekAnimals", buttons: ["Upload new video", "Not interested"] },
    ],
  },
  N1: {
    name: "Not selected",
    when: "The creator is not selected / rejected",
    stops: "sent once",
    msgs: [{ after: "now", text: "Hi {name}, thank you for applying to the {campaign} campaign. This time, the brand has decided to go ahead with other creators.\n\nNote from the team: {note}\n\nYour profile stays active, and we will share new campaigns that match your profile.\n\n@GeekAnimals", buttons: ["View campaigns", "Not interested"] }],
  },
  R1: {
    name: "Return the product",
    when: "A backout with a product return is approved",
    stops: "the return is shipped / received / cancelled",
    msgs: [
      { after: "now", text: "Hi {name}, your request for the {campaign} campaign has been approved. Please send the product back by {due} to this address:\n\n{address}\n\nAfter you ship it, add the courier name and tracking ID on your campaign page.\n\n@GeekAnimals", buttons: ["Add tracking", "Need help"] },
      { after: "3 days", text: "Hi {name}, this is a reminder to return the {campaign} product by {due}. Once it is shipped, please add the courier name and tracking ID on your campaign page.\n\n@GeekAnimals", buttons: ["Add tracking", "Need help"] },
      { after: "6 days", text: "Final reminder, {name}: the {campaign} product must reach us by {due}. Please ship it today and add the tracking ID.\n\n@GeekAnimals", buttons: ["Add tracking", "Need help"] },
    ],
  },
};

/* campaign step (api.campaign_message_map key) → Snapto drip. Steps not here send no WhatsApp (email + app only). */
export const STEP_DRIP = {
  invited: "01",
  contract_sent: "10",
  confirm_address: "12",
  product_shipped: "07",
  parcel_received: "08",
  video_due: "09",
  content_approved: "13",
  completed: "14",
  paid_brief_ready: "P1",
  changes_requested: "C1",
  not_selected: "N1",
  backout_return_approved: "R1",
};
export const ACCOUNT_DRIPS = ["02", "04", "05", "06"];

export const SAMPLE = { note: "Show the product name in the first 3 seconds", name: "Asha", courier: "Delhivery", tracking: "DL1234567890", address: "H-12, Sector 5, Noida 201301", due: "25 Nov", ig: "asha.creates" };
/** text → [{t, v}] pieces (v = true for a filled placeholder) */
export function fillParts(text, vals) {
  return String(text)
    .split(/(\{[a-z]+\})/g)
    .filter(Boolean)
    .map((s) => {
      const m = /^\{([a-z]+)\}$/.exec(s);
      return m && vals[m[1]] != null ? { t: vals[m[1]], v: true } : { t: s, v: false };
    });
}
