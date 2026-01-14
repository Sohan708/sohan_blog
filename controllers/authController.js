import bcrypt from 'bcrypt';
import User from '../models/User.js';

export function loginForm(req, res) {
  res.render('admin/login', { title: 'Admin Login', error: null });
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials.' });
    }
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) {
      return res.render('admin/login', { title: 'Admin Login', error: 'Invalid credentials.' });
    }
    req.session.user = { id: user._id.toString(), name: user.name, role: user.role };
    return res.redirect('/admin');
  } catch (error) {
    return next(error);
  }
}

export function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
}

