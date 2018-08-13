const crypto = require('crypto');
const phpUnserialize = require('php-unserialize');

function getRyzomUser(req, appKey) {
  if (req.query.user && req.query.checksum) {
    const hmac = crypto.createHmac('sha1', appKey);
    hmac.update(req.query.user);
    const checksum = hmac.digest('hex').toString();
    if (req.query.checksum === checksum) {
      return phpUnserialize.unserialize(Buffer.from(req.query.user, 'base64').toString());
    }
  }

  return null;
}

module.exports = function buildAuth(appKey) {
  return function(req, res, next) {
    const user = getRyzomUser(req, appKey);
    if (user) {
      req.session.guildId = user.guild_id;
    }

    if (req.session.guildId === '105906221') {
      next();
    } else {
      const forbidden = new Error('forbidden');
      forbidden.status_code = 403;
      next(forbidden);
    }
  };
};
