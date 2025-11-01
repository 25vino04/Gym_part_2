export function requireAuth(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

export function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
            status: 'Access Denied',
            message: 'Administrator access required'
        });
    }
    next();
}

export function requireMember(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'member') {
        return res.status(403).render('error', {
            status: 'Access Denied',
            message: 'Member access required'
        });
    }
    next();
}

export function requireTrainer(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'trainer') {
        return res.status(403).render('error', {
            status: 'Access Denied',
            message: 'Trainer access required'
        });
    }
    next();
}