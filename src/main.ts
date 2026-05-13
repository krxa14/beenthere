import { Devvit } from '@devvit/public-api';

Devvit.configure({
  redditAPI: true,
  redis: true,
});

import './settings.js';
import './menu/addTag.js';
import './menu/editTag.js';
import './menu/vouch.js';
import './menu/unvouch.js';
import './triggers/commentCreate.js';
import './triggers/postCreate.js';
import './scheduler/summaryRefresh.js';

export default Devvit;
