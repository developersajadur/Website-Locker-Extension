import { Router } from 'express';
import { AuthRoutes } from './auth.route';
import { SiteRoutes } from './site.route';

const router = Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/sites',
    route: SiteRoutes,
  },
];

moduleRoutes.forEach((item) => router.use(item.path, item.route));

export default router;
