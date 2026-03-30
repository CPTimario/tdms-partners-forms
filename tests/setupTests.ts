export {};

// Enable React 18 act environment for tests
// See: https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#configure-your-test-environment
declare global {
  // React test harness looks for this global; declare it to avoid `any` casts
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
