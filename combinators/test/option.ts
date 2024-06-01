import { test } from 'node:test'
import assert from 'node:assert'
import { None, Some } from '#src/option.js'
import { Err, Ok } from '#src/result.js'

test('should be able to construct options', async t => {
  await t.test('for a some variant', () => {
    Some(5)
    Some(true)
    Some('foo')
  })

  await t.test('for a none variant', () => {
    const _ = None
  })
})

test('should be able to test variants', async t => {
  await t.test('for a some variant', () => {
    assert(Some(5).is_some())
    assert(Some(true).is_some())
    assert(Some('foo').is_some())

    assert(Some(5).is_some_and(v => v > 2))
    assert(!Some(5).is_some_and(v => v < 4))
    assert(Some('foo').is_some_and(v => v.includes('oo')))

    assert(!Some(5).is_none())
    assert(!Some(true).is_none())
    assert(!Some('foo').is_none())
  })

  await t.test('for a none variant', () => {
    assert(None.is_none())
    assert(!None.is_some_and(_ => true))
    assert(!None.is_some())
  })
})

test('should be able to test equality', async t => {
  await t.test('of some variants', () => {
    assert(Some(2).eq(Some(2)))
    assert(Some(true).eq(Some(true)))
    assert(Some('foo').eq(Some('foo')))

    assert(!Some(2).eq(Some(3)))
    assert(!Some(true).eq(Some(false)))
    assert(!Some('foo').eq(Some('bar')))
  })

  await t.test('of none variants', () => {
    assert(None.eq(None))
  })

  await t.test('of opposite variants', () => {
    assert(!Some(2).eq(None))
    assert(!None.eq(Some(2)))
  })

  await t.test('with custom equality', () => {
    // we can't test this case with standard `.eq`
    assert(!Some({ a: 2 }).eq(Some({ a: 2 })))

    assert(
      Some({ a: 2 }).eq_with(Some({ a: 2 }), ({ a: x }, { a: y }) => x === y)
    )
    assert(
      !Some({ a: 2 }).eq_with(Some({ a: 3 }), ({ a: x }, { a: y }) => x === y)
    )

    // you can use any equality test
    assert(
      Some({ a: 2 }).eq_with(Some({ a: 3 }), ({ a: x }, { a: y }) => x < y)
    )
    assert(
      !Some({ a: 3 }).eq_with(Some({ a: 2 }), ({ a: x }, { a: y }) => x < y)
    )

    // opposite variants aren't equal
    assert(!Some({ a: 2 }).eq_with(None, ({ a: x }, { a: y }) => x === y))
    assert(!None.eq_with(Some({ a: 2 }), ({ a: x }, { a: y }) => x === y))

    // vacuous equality works with the same variants, but not opposite
    assert(Some(2).eq_with(Some(3), () => true))
    assert(!Some(2).eq_with(None, () => true))
  })
})

test('should be able to unwrap options', async t => {
  await t.test('always for a some variant', () => {
    Some(5).unwrap()
    Some(true).unwrap()
    Some('foo').unwrap()

    assert.strictEqual(Some(5).unwrap(), 5)
    assert.strictEqual(Some(true).unwrap(), true)
    assert.strictEqual(Some('foo').unwrap(), 'foo')
  })

  await t.test('never for a none variant', () => {
    assert.throws(
      () => None.unwrap(),
      new TypeError('Cannot unwrap `None` value')
    )
  })

  await t.test('always with `unwrap_or`', () => {
    Some(5).unwrap_or(2)
    None.unwrap_or(2)

    assert.strictEqual(Some(5).unwrap_or(true), 5)
    assert.strictEqual(None.unwrap_or(true), true)
  })
})

test('should be able to map over options', async t => {
  await t.test("modifying a some's contained value", () => {
    assert(
      Some(5)
        .map(v => v + 1)
        .eq(Some(6))
    )
    assert(
      Some(true)
        .map(v => !v)
        .eq(Some(false))
    )
    assert(
      Some('foo')
        .map(v => v.indexOf('o'))
        .eq(Some(1))
    )
  })

  await t.test('not affecting a none variant', () => {
    assert(None.map(_ => true).eq(None))
  })

  await t.test('allowing for a default', () => {
    assert.strictEqual(
      Some(5).map_or(v => v + 1, 0),
      6
    )
    assert.strictEqual(
      Some(true).map_or(v => !v, true),
      false
    )
    assert.strictEqual(
      Some('foo').map_or(v => v.indexOf('o'), 5),
      1
    )
    assert.strictEqual(
      None.map_or(_ => true, false),
      false
    )
  })
})

test('should be able to chain options', async t => {
  await t.test('with a contained value', () => {
    assert(
      Some(2)
        .then(v => Some(v))
        .eq(Some(2))
    )
    assert(
      Some(2)
        .then(v => Some(v + 1))
        .eq(Some(3))
    )
    assert(
      Some(2)
        .then(_ => None)
        .eq(None)
    )
  })

  await t.test('without a contained value', () => {
    assert(None.then(v => Some(v)).eq(None))
    assert(None.then(v => Some(v + 1)).eq(None))
    assert(None.then(_ => None).eq(None))
  })
})

test('should be able to default to another option', async t => {
  await t.test('with a some variant', () => {
    assert(Some(2).or(Some(3)).eq(Some(2)))
    assert(Some(2).or(None).eq(Some(2)))
  })

  await t.test('with a none variant', () => {
    assert(None.or(Some(3)).eq(Some(3)))
    assert(None.or(None).eq(None))
  })
})

test('should be able to combine with another option', async t => {
  /** very simple array equality */
  const array_eq = (xs: any[], ys: any[]) =>
    xs.length === ys.length && xs.every((x, i) => x === ys[i])

  await t.test('with a some variant', () => {
    assert(
      Some(2)
        .zip(Some(3))
        .eq_with(Some([2, 3]), array_eq)
    )
    assert(Some(2).zip(None).eq(None))
  })

  await t.test('with a none variant', () => {
    assert(None.zip(Some(3)).eq(None))
    assert(None.zip(None).eq(None))
  })
})

test('should be able to convert to a result', async t => {
  await t.test('from a some variant', () => {
    assert(Some(2).ok(true).eq(Ok(2)))
    assert(Some(2).err(true).eq(Err(2)))
  })

  await t.test('from a none variant', () => {
    assert(None.ok(true).eq(Err(true)))
    assert(None.err(true).eq(Ok(true)))
  })
})
