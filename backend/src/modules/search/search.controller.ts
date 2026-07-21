import { Response } from 'express';
import { AuthenticatedRequest } from '../../types';
import { asyncHandler } from '../../middleware/asyncHandler';
import { search } from './search.service';

export const searchAll = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const q = (req.query.q as string) || '';
  if (q.trim().length < 1) {
    res.status(200).json({
      success: true,
      data: {
        destinations: [],
        flights: [],
        hotels: [],
        tours: [],
        airports: [],
        totalResults: 0,
      },
    });
    return;
  }
  if (q.length > 200) {
    res.status(400).json({
      success: false,
      error: { code: 'QUERY_TOO_LONG', message: 'Search query must be 200 characters or fewer' },
    });
    return;
  }
  const results = await search(q);
  res.status(200).json({ success: true, data: results });
});
