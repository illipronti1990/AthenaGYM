describe('PX-6 datagrid rules', () => {
  it('clamps page size between 10 and 200', () => {
    const clamp = (n: number) => Math.min(200, Math.max(10, n));
    expect(clamp(5)).toBe(10);
    expect(clamp(50)).toBe(50);
    expect(clamp(500)).toBe(200);
  });

  it('maps sort toggle cycle', () => {
    type Sort = { id: string; desc: boolean } | null;
    function next(sort: Sort, id: string): Sort {
      if (!sort || sort.id !== id) return { id, desc: false };
      if (!sort.desc) return { id, desc: true };
      return null;
    }
    expect(next(null, 'name')).toEqual({ id: 'name', desc: false });
    expect(next({ id: 'name', desc: false }, 'name')).toEqual({ id: 'name', desc: true });
    expect(next({ id: 'name', desc: true }, 'name')).toBeNull();
  });
});
