if (window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion().then(version => {
        document.getElementById('version').innerText = `v${version}`;
      });
    }