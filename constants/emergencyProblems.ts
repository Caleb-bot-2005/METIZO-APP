// Quick-tap problem types per emergency category — keeps the form to a couple
// of taps instead of asking the customer to type a description under stress.
export const emergencyProblemTypes: Record<string, string[]> = {
  plumber: ['Pipe burst', 'Blocked drain', 'No water supply', 'Leaking tap'],
  electrician: ['Power outage', 'Sparking outlet', 'Tripped breaker', 'Exposed wiring'],
  locksmith: ['Locked out of house', 'Locked out of car', 'Broken key in lock'],
  ac_technician: ['AC not cooling', 'AC leaking water', "AC won't turn on"],
  generator_technician: ["Generator won't start", 'No power output', 'Fuel issue'],
  mechanic: ["Car won't start", 'Flat tire', 'Engine overheating', 'Roadside breakdown'],
  roofer: ['Roof leak', 'Storm damage', 'Fallen debris on roof'],
  technician: ['Appliance not working', 'Fridge/freezer failure'],
};
