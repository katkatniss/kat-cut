export const secondToTimeFormat = (sec) => {
  const res = new Array(3);

  const arr = ('' + sec).split('.');
  res[0] = ('' + Math.floor((arr[0]-'') / 60)).padStart(2, '0');
  res[1] = ('' + (arr[0]-'') % 60).padStart(2, '0');
  res[2] = ('' + Math.ceil(((arr[1] || '0').padEnd(2, '0').substring(0, 2)  - '') / 10));

  return `${res[0]}:${res[1]}.${res[2]}`;
};

let loadingDiv = null;

export const loading = () => {
  loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `<span style="margin: 40dvh auto;text-align: center;display: block">Loading...</span>`;
  Object.assign(loadingDiv.style, styles.loadingDiv);
  document.body.appendChild(loadingDiv);
};

export const closeLoading = () => {
  if (loadingDiv) {
    document.body.removeChild(loadingDiv);
    loadingDiv = null;
  }
};

export const isMobileDevice = () => {
  const mobileDevices = ['Android', 'webOS', 'iPhone', 'iPad', 'iPod', 'BlackBerry', 'Windows Phone']
  for (let i = 0; i < mobileDevices.length; i++) {
    if (navigator.userAgent.match(mobileDevices[i])) {
      return true;
    }
  }
  return false
}

const styles = {
  loadingDiv: {
    position: 'absolute',
    zIndex: 1,
    background: 'gray',
    opacity: 0.7,
    width: '100vw',
    height: '100dvh'
  }
};