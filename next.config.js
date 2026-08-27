const os = require('os');

const getLocalIPs = () => {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
};

const nextConfig = {
  allowedDevOrigins: getLocalIPs(),
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;