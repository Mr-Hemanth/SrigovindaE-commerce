import { optimizeCloudinaryUrl } from './cloudinary';

describe('optimizeCloudinaryUrl', () => {
  it('inserts f_auto,q_auto after /upload/ for a Cloudinary URL', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234/products/abc.png';
    expect(optimizeCloudinaryUrl(url)).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto/v1234/products/abc.png'
    );
  });

  it('adds a width cap when width is passed', () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1234/products/abc.png';
    expect(optimizeCloudinaryUrl(url, { width: 800 })).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1234/products/abc.png'
    );
  });

  it('leaves non-Cloudinary URLs untouched', () => {
    const url = 'https://images.unsplash.com/photo-123?w=500';
    expect(optimizeCloudinaryUrl(url)).toBe(url);
  });

  it('leaves non-string input untouched', () => {
    expect(optimizeCloudinaryUrl(undefined)).toBeUndefined();
    expect(optimizeCloudinaryUrl(null)).toBeNull();
  });
});
