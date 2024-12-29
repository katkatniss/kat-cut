export const secondToTimeFormat = (sec) => {
  const res = new Array(3);

  const arr = ('' + sec).split('.');
  res[0] = ('' + Math.floor((arr[0]-'') / 60)).padStart(2, '0');
  res[1] = ('' + (arr[0]-'') % 60).padStart(2, '0');
  res[2] = ('' + Math.round(((arr[1] || '0')  - '') / 1000)).padEnd(3, '0');

  return `${res[0]}:${res[1]}.${res[2]}`;
};

let loadingDiv = null;

export const loading = () => {
  loadingDiv = document.createElement('div');
  loadingDiv.innerHTML = `<span style="margin: 40vh auto;text-align: center;display: block">Loading...</span>`;
  Object.assign(loadingDiv.style, styles.loadingDiv);
  document.body.appendChild(loadingDiv);
};

export const closeLoading = () => {
  if (loadingDiv) {
    document.body.removeChild(loadingDiv);
    loadingDiv = null;
  }
};

const styles = {
  loadingDiv: {
    position: 'absolute',
    zIndex: 1,
    background: 'gray',
    opacity: 0.7,
    width: '100vw',
    height: '100vh'
  }
};