import Router from 'express';
import { BadRequestError, NotFoundError, requireAuth } from '@chortec/common';
import Activity from '../models/activity';


const router = Router();

router.get('/', requireAuth, async (req, res) => {
  if (!req.user) throw new BadRequestError('Invalid state!');

  const activities = await Activity.find({
    involved: { $in: [req.user.id] }
  });

  res.status(200).json(activities);
});

export { router as getActivitiesRouter };