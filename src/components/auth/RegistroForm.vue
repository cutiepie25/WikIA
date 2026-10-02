<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../../composables/useAuth'

const { loading, error, message, signUp } = useAuth()

const nombre = ref('')
const email = ref('')
const password = ref('')

function enviar() {
	signUp(email.value, password.value, nombre.value)
}
</script>

<template>
	<section class="auth-card">
		<h1>Crear cuenta</h1>

		<form class="auth-form" @submit.prevent="enviar">
			<input v-model="nombre" type="text" placeholder="Nombre completo" required />
			<input v-model="email" type="email" placeholder="Correo" required />
			<input v-model="password" type="password" placeholder="Contraseña (mín. 6)" minlength="6" required />
			<button :disabled="loading">{{ loading ? 'Creando...' : 'Registrarme' }}</button>
		</form>

		<p v-if="error" role="alert">{{ error }}</p>
		<p v-if="message">{{ message }}</p>
		<p>¿Ya tienes cuenta? <a href="/auth/login">Inicia sesión</a></p>
	</section>
</template>

<style scoped>
/* Layout only: narrow centered card with vertical rhythm. */
.auth-card {
	max-width: 420px;
	width: 100%;
	margin-inline: auto;
	display: flex;
	flex-direction: column;
	gap: 1rem;
}
.auth-form {
	display: flex;
	flex-direction: column;
	gap: 0.9rem;
}
.auth-form input,
.auth-form button {
	width: 100%;
	padding: 0.65rem 0.8rem;
}
</style>
