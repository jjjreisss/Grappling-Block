# Grappling Block

[Check it out live][github-pages]

[github-pages]: http://jjjreisss.github.io/Grappling-Block

### Visuals & Physics
* Grappling hook shoots with a velocity vector derived from the path from the character sprite and the mouse.
* Both grappling hook and the character can bounce off the walls. In a bounce, the y-velocity is preserved and the x-velocity is reversed.
* After a successful shot, the character is vaulted with a velocity proportional to the character's distance from the hooked platform. The vaulting movement happens in three phases:
  * Until the character collides with the platform, the character flies upward while the screen background stays stationary.
  * After the character passes the platform, the screen moves down with the character's former velocity, and the character stays stationary. This gives the illusion that the character is moving up. During this phase, the velocity is constantly decreasing to mimic gravity.
  * Once the background stops moving because gravity reduces the velocity to zero, the character sprite starts to move down with increasing velocity.
