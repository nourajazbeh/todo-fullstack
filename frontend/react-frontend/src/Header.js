import React from 'react';

function Header() {
  return (
    <header class="d-flex justify-content-center py-3">
  <ul class="nav nav-pills">
    <li class="nav-item"><a href="#" class="nav-link btn-success active" aria-current="page">Home</a></li>
    <li class="nav-item"><a href="#" class="nav-link btn-success">Features</a></li>
    <li class="nav-item"><a href="#" class="nav-link btn-success">Pricing</a></li>
    <li class="nav-item"><a href="#" class="nav-link btn-success">FAQs</a></li>
    <li class="nav-item"><a href="#" class="nav-link btn-success">About</a></li>
  </ul>
</header>

  );
}

export default Header;