
import React from 'react';
import { ContentType, ContentTag, PostStatus } from './types';

export const CONTENT_TYPES: ContentType[] = ['Static', 'Carousel', 'Reel', 'Video', 'Story'];

export const CONTENT_TAGS: ContentTag[] = [
  'Offer',
  'Launch',
  'Feature Highlight',
  'Comparison',
  'Tips',
  'Review',
  'Setup Build'
];

export const POST_STATUSES: PostStatus[] = ['Planned', 'Designed', 'Published'];

export const ROLES = ['Admin', 'Editor', 'Viewer'] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
