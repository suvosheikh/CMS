import React from 'react';
import { ContentType, ContentTag, PostStatus, CreativePlatform, CreativeMedium } from './types';

export const CONTENT_TYPES: ContentType[] = [
  'Static', 
  'Carousel', 
  'Reel', 
  'Video', 
  'Story'
];

export const CONTENT_TAGS: ContentTag[] = [
  'Offer',
  'Launch',
  'Feature Highlight',
  'Review',
  'Tips',
  'Gift Handover',
  'Branding'
];

export const POST_STATUSES: PostStatus[] = ['Planned', 'Designed', 'Published'];

export const ROLES = ['Admin', 'Editor', 'Viewer'] as const;

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const CREATIVE_PLATFORMS: CreativePlatform[] = [
  'Branch',
  'Social Media',
  'Ads',
  'Website',
  'Website Offer',
  'Thumbnail',
  'Print',
  'TV Content',
  'Others'
];

export const CREATIVE_MEDIUMS: CreativeMedium[] = [
  'Digital Image',
  'Physical Image',
  'Video'
];

export const DESIGNER_NAMES = [
  'Designer 1',
  'Designer 2',
  'Video Editor'
];