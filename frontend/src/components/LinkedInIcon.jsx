/** Official LinkedIn "in" logo — used inline in auth buttons */
export default function LinkedInIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="4" fill="#0A66C2" />
      <path
        d="M7.5 9.75H5.25V18H7.5V9.75ZM6.375 8.625C7.2 8.625 7.875 7.95 7.875 7.125C7.875 6.3 7.2 5.625 6.375 5.625C5.55 5.625 4.875 6.3 4.875 7.125C4.875 7.95 5.55 8.625 6.375 8.625Z"
        fill="white"
      />
      <path
        d="M18.75 18H16.5V13.65C16.5 12.525 16.275 11.625 14.85 11.625C13.425 11.625 13.125 12.3 13.125 13.575V18H10.875V9.75H13.05V10.65C13.35 10.125 14.1 9.525 15.3 9.525C17.625 9.525 18.75 10.875 18.75 13.35V18Z"
        fill="white"
      />
    </svg>
  );
}
