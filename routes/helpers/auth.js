exports.requireLogin = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    }
  
    const err = new Error('You must log in to view this page');
    err.status = 401;
    return res.redirect('/login');
  };

  

  /*This function checks for the existence of a session, and a userId value on that session. If they both exist, we call next() and continue on; otherwise we redirect the user to the login page.*/ 