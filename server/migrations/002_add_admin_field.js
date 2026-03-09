/**
 * Migration 002: Add is_admin field
 *
 * Sets is_admin = false on every existing user document that lacks the field.
 */
module.exports = {
  id: '002_add_admin_field',

  async up({ getUsersDb }) {
    const usersDb = getUsersDb();
    const { docs: users } = await usersDb.find({
      selector: { type: 'user' },
      limit: 10000,
    });

    for (const user of users) {
      if (user.is_admin === undefined) {
        user.is_admin = false;
        await usersDb.insert(user);
      }
    }

    console.log(`Set is_admin=false on ${users.filter(u => u.is_admin === undefined || !u.is_admin).length} users`);
  },
};
