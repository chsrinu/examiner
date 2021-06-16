/* eslint-disable no-undef */
require('../../../globals/fileImportWrapper');

const cacheKeyGenerator = include('server/src/helpers/cacheKeyGenerator');

describe('CacheKey generator Test Suite', () => {
  it('For User path', () => {
    const userPathCacheKey = cacheKeyGenerator.generateKey('/user', 'test@gmail.com');
    expect(userPathCacheKey).toBe('user_test@gmail.com');
  });
  it('For paths which are not allowed to cache responses', () => {
    const rootPathCacheKey = cacheKeyGenerator.generateKey('/logoff', 'test@gmail.com');
    expect(rootPathCacheKey).toBeNull();
  });
});
