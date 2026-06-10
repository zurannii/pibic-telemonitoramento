import type { IconName } from "../types";

type IconProps = {
  name: IconName;
  className?: string;
};

export function Icon({ name, className }: IconProps) {
  switch (name) {
    case "brand":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 4.16667C10.001 3.83336 9.93532 3.50322 9.80685 3.19567C9.67837 2.88811 9.4897 2.60936 9.25191 2.37579C9.01413 2.14222 8.73204 1.95856 8.42224 1.83561C8.11243 1.71266 7.78117 1.6529 7.44793 1.65984C7.1147 1.66679 6.78621 1.7403 6.4818 1.87606C6.17739 2.01181 5.9032 2.20707 5.67536 2.45034C5.44751 2.69361 5.27061 2.97999 5.15506 3.29263C5.03952 3.60527 4.98765 3.93786 5.00252 4.27083C4.51269 4.39678 4.05794 4.63254 3.67271 4.96026C3.28749 5.28798 2.98189 5.69906 2.77906 6.16237C2.57623 6.62569 2.48149 7.12908 2.50201 7.63443C2.52254 8.13978 2.65779 8.63383 2.89752 9.07917C2.476 9.42161 2.14454 9.86186 1.93197 10.3616C1.7194 10.8614 1.63215 11.4055 1.67782 11.9467C1.7235 12.4878 1.9007 13.0096 2.19403 13.4667C2.48735 13.9237 2.88791 14.3022 3.36085 14.5692C3.30245 15.021 3.3373 15.4801 3.46326 15.9179C3.58922 16.3558 3.8036 16.7632 4.09318 17.115C4.38275 17.4667 4.74136 17.7554 5.14687 17.9631C5.55238 18.1709 5.99617 18.2933 6.45083 18.3228C6.9055 18.3523 7.36139 18.2883 7.79034 18.1347C8.2193 17.9811 8.61221 17.7412 8.94482 17.4298C9.27743 17.1184 9.54267 16.7421 9.72416 16.3242C9.90565 15.9063 9.99953 15.4556 10 15V4.16667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 4.16667C9.99903 3.83336 10.0647 3.50322 10.1932 3.19567C10.3217 2.88811 10.5103 2.60936 10.7481 2.37579C10.9859 2.14222 11.268 1.95856 11.5778 1.83561C11.8876 1.71266 12.2189 1.6529 12.5521 1.65984C12.8853 1.66679 13.2138 1.7403 13.5182 1.87606C13.8226 2.01181 14.0968 2.20707 14.3247 2.45034C14.5525 2.69361 14.7294 2.97999 14.845 3.29263C14.9605 3.60527 15.0124 3.93786 14.9975 4.27083C15.4873 4.39678 15.9421 4.63254 16.3273 4.96026C16.7125 5.28798 17.0181 5.69906 17.221 6.16237C17.4238 6.62569 17.5185 7.12908 17.498 7.63443C17.4775 8.13978 17.3422 8.63383 17.1025 9.07917C17.524 9.42161 17.8555 9.86186 18.0681 10.3616C18.2806 10.8614 18.3679 11.4055 18.3222 11.9467C18.2765 12.4878 18.0993 13.0096 17.806 13.4667C17.5127 13.9237 17.1121 14.3022 16.6392 14.5692C16.6976 15.021 16.6627 15.4801 16.5368 15.9179C16.4108 16.3558 16.1964 16.7632 15.9069 17.115C15.6173 17.4667 15.2587 17.7554 14.8532 17.9631C14.4477 18.1709 14.0039 18.2933 13.5492 18.3228C13.0945 18.3523 12.6386 18.2883 12.2097 18.1347C11.7807 17.9811 11.3878 17.7412 11.0552 17.4298C10.7226 17.1184 10.4574 16.7421 10.2759 16.3242C10.0944 15.9063 10.0005 15.4556 10 15V4.16667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12.5 10.8333C11.8004 10.5872 11.1894 10.1392 10.7444 9.54584C10.2994 8.95251 10.0404 8.24056 10 7.5C9.95962 8.24056 9.70056 8.95251 9.25556 9.54584C8.81057 10.1392 8.19963 10.5872 7.5 10.8333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.6659 5.41671C14.8676 5.06719 14.9817 4.67406 14.9984 4.27087" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.00244 4.27087C5.01892 4.67399 5.13272 5.06712 5.33411 5.41671" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M2.89746 9.08C3.04991 8.95584 3.21305 8.84541 3.38496 8.75" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.615 8.75C16.7869 8.84541 16.95 8.95584 17.1025 9.08" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.00001 14.9999C4.4257 15.0002 3.86106 14.8521 3.36084 14.5699" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M16.6392 14.5699C16.1389 14.8521 15.5743 15.0002 15 14.9999" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "overview":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M18.3333 5.83337L11.25 12.9167L7.08329 8.75004L1.66663 14.1667" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.3334 5.83337H18.3334V10.8334" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "patients":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M13.3333 17.5V15.8333C13.3333 14.9493 12.9821 14.1014 12.357 13.4763C11.7319 12.8512 10.884 12.5 9.99996 12.5H4.99996C4.1159 12.5 3.26806 12.8512 2.64294 13.4763C2.01782 14.1014 1.66663 14.9493 1.66663 15.8333V17.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.49996 9.16667C9.34091 9.16667 10.8333 7.67428 10.8333 5.83333C10.8333 3.99238 9.34091 2.5 7.49996 2.5C5.65901 2.5 4.16663 3.99238 4.16663 5.83333C4.16663 7.67428 5.65901 9.16667 7.49996 9.16667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M18.3334 17.4999V15.8333C18.3328 15.0947 18.087 14.3773 17.6345 13.7935C17.182 13.2098 16.5485 12.7929 15.8334 12.6083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.3334 2.60828C14.0504 2.79186 14.6859 3.20886 15.1397 3.79353C15.5936 4.37821 15.8399 5.0973 15.8399 5.83744C15.8399 6.57758 15.5936 7.29668 15.1397 7.88135C14.6859 8.46603 14.0504 8.88303 13.3334 9.06661" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "alerts":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M18.1083 15L11.4416 3.33332C11.2962 3.07682 11.0854 2.86347 10.8307 2.71504C10.576 2.56661 10.2864 2.4884 9.99161 2.4884C9.69678 2.4884 9.40724 2.56661 9.1525 2.71504C8.89777 2.86347 8.68697 3.07682 8.54161 3.33332L1.87494 15C1.72801 15.2544 1.65096 15.5432 1.65162 15.8371C1.65227 16.1309 1.73059 16.4194 1.87865 16.6732C2.0267 16.927 2.23923 17.1371 2.49469 17.2823C2.75014 17.4275 3.03945 17.5026 3.33327 17.5H16.6666C16.959 17.4997 17.2462 17.4225 17.4993 17.2761C17.7525 17.1297 17.9626 16.9192 18.1087 16.6659C18.2548 16.4126 18.3316 16.1253 18.3316 15.8329C18.3315 15.5405 18.2545 15.2532 18.1083 15Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 7.5V10.8333" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 14.1666H10.0083" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "questions":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M17.5 12.5C17.5 12.942 17.3244 13.366 17.0118 13.6785C16.6993 13.9911 16.2754 14.1667 15.8333 14.1667H5.83333L2.5 17.5V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H15.8333C16.2754 2.5 16.6993 2.67559 17.0118 2.98816C17.3244 3.30072 17.5 3.72464 17.5 4.16667V12.5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "reports":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 1.66663H5.00004C4.55801 1.66663 4.13409 1.84222 3.82153 2.15478C3.50897 2.46734 3.33337 2.89127 3.33337 3.33329V16.6666C3.33337 17.1087 3.50897 17.5326 3.82153 17.8451C4.13409 18.1577 4.55801 18.3333 5.00004 18.3333H15C15.4421 18.3333 15.866 18.1577 16.1786 17.8451C16.4911 17.5326 16.6667 17.1087 16.6667 16.6666V5.83329L12.5 1.66663Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M11.6666 1.66663V4.99996C11.6666 5.44199 11.8422 5.86591 12.1548 6.17847C12.4673 6.49103 12.8913 6.66663 13.3333 6.66663H16.6666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.33329 7.5H6.66663" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.3333 10.8334H6.66663" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M13.3333 14.1666H6.66663" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "team":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M16.6667 10.8333C16.6667 15 13.75 17.0833 10.2834 18.2916C10.1018 18.3531 9.90466 18.3502 9.72504 18.2833C6.25004 17.0833 3.33337 15 3.33337 10.8333V4.99997C3.33337 4.77895 3.42117 4.56699 3.57745 4.41071C3.73373 4.25443 3.94569 4.16663 4.16671 4.16663C5.83337 4.16663 7.91671 3.16663 9.36671 1.89997C9.54325 1.74913 9.76784 1.66626 10 1.66626C10.2322 1.66626 10.4568 1.74913 10.6334 1.89997C12.0917 3.17497 14.1667 4.16663 15.8334 4.16663C16.0544 4.16663 16.2663 4.25443 16.4226 4.41071C16.5789 4.56699 16.6667 4.77895 16.6667 4.99997V10.8333Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "clock":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M9.99996 18.3333C14.6023 18.3333 18.3333 14.6023 18.3333 9.99996C18.3333 5.39759 14.6023 1.66663 9.99996 1.66663C5.39759 1.66663 1.66663 5.39759 1.66663 9.99996C1.66663 14.6023 5.39759 18.3333 9.99996 18.3333Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 5V10L13.3333 11.6667" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "idea":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.5 11.6666C12.6667 10.8333 13.0833 10.25 13.75 9.58329C14.5833 8.83329 15 7.74996 15 6.66663C15 5.34054 14.4732 4.06877 13.5355 3.13109C12.5979 2.19341 11.3261 1.66663 10 1.66663C8.67392 1.66663 7.40215 2.19341 6.46447 3.13109C5.52678 4.06877 5 5.34054 5 6.66663C5 7.49996 5.16667 8.49996 6.25 9.58329C6.83333 10.1666 7.33333 10.8333 7.5 11.6666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 15H12.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8.33331 18.3334H11.6666" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "microphone":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 1.66663C9.33696 1.66663 8.70107 1.93002 8.23223 2.39886C7.76339 2.8677 7.5 3.50358 7.5 4.16663V9.99996C7.5 10.663 7.76339 11.2989 8.23223 11.7677C8.70107 12.2366 9.33696 12.5 10 12.5C10.663 12.5 11.2989 12.2366 11.7678 11.7677C12.2366 11.2989 12.5 10.663 12.5 9.99996V4.16663C12.5 3.50358 12.2366 2.8677 11.7678 2.39886C11.2989 1.93002 10.663 1.66663 10 1.66663Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.8333 8.33337V10C15.8333 11.5471 15.2187 13.0309 14.1247 14.1248C13.0308 15.2188 11.5471 15.8334 9.99996 15.8334C8.45286 15.8334 6.96913 15.2188 5.87517 14.1248C4.78121 13.0309 4.16663 11.5471 4.16663 10V8.33337" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 15.8334V18.3334" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "edit":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M10 2.5H4.16667C3.72464 2.5 3.30072 2.67559 2.98816 2.98816C2.67559 3.30072 2.5 3.72464 2.5 4.16667V15.8333C2.5 16.2754 2.67559 16.6993 2.98816 17.0118C3.30072 17.3244 3.72464 17.5 4.16667 17.5H15.8333C16.2754 17.5 16.6993 17.3244 17.0118 17.0118C17.3244 16.6993 17.5 16.2754 17.5 15.8333V10" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M15.3125 2.18744C15.644 1.85592 16.0937 1.66968 16.5625 1.66968C17.0313 1.66968 17.481 1.85592 17.8125 2.18744C18.144 2.51897 18.3303 2.9686 18.3303 3.43744C18.3303 3.90629 18.144 4.35592 17.8125 4.68744L10.3017 12.1991C10.1038 12.3968 9.85933 12.5415 9.59083 12.6199L7.19666 13.3199C7.12496 13.3409 7.04895 13.3421 6.97659 13.3236C6.90423 13.305 6.83819 13.2674 6.78537 13.2146C6.73255 13.1618 6.6949 13.0957 6.67637 13.0234C6.65783 12.951 6.65908 12.875 6.68 12.8033L7.38 10.4091C7.45877 10.1408 7.60378 9.89666 7.80166 9.69911L15.3125 2.18744Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "save":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M12.6667 2.5C13.1063 2.50626 13.5256 2.68598 13.8333 3L17 6.16667C17.314 6.47438 17.4937 6.89372 17.5 7.33333V15.8333C17.5 16.2754 17.3244 16.6993 17.0118 17.0118C16.6993 17.3244 16.2754 17.5 15.8333 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H12.6667Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.1666 17.5V11.6667C14.1666 11.4457 14.0788 11.2337 13.9226 11.0775C13.7663 10.9212 13.5543 10.8334 13.3333 10.8334H6.66665C6.44563 10.8334 6.23367 10.9212 6.07739 11.0775C5.92111 11.2337 5.83331 11.4457 5.83331 11.6667V17.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.83331 2.5V5.83333C5.83331 6.05435 5.92111 6.26631 6.07739 6.42259C6.23367 6.57887 6.44563 6.66667 6.66665 6.66667H12.5" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "search":
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 2a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm8.71 12.29L22 20.59 20.59 22l-3.29-3.29z" fill="currentColor" />
        </svg>
      );
    case "eye":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M1.66663 10C1.66663 10 4.69663 4.16663 9.99996 4.16663C15.3033 4.16663 18.3333 10 18.3333 10C18.3333 10 15.3033 15.8333 9.99996 15.8333C4.69663 15.8333 1.66663 10 1.66663 10Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61925 11.3807 7.5 10 7.5C8.61925 7.5 7.5 8.61925 7.5 10C7.5 11.3807 8.61925 12.5 10 12.5Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M15.8333 10H4.16663" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M10 15.8334L4.16663 10L10 4.16669" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "filter":
      return (
        <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M2.5 4.16663H17.5L11.6667 11.0666V15.8333L8.33333 17.5V11.0666L2.5 4.16663Z" stroke="currentColor" strokeWidth="1.66667" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return null;
  }
}
