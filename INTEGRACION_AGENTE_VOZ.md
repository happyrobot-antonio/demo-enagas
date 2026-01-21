# Integración del Agente de Voz con el Dashboard GTS

Este documento explica cómo integrar el agente de voz de Mesa de Servicios GTS con el sistema de visualización en tiempo real.

## 📋 Resumen

El agente de voz tiene 4 herramientas (tools) principales que deben enviar datos a la API:

1. `search_gts_documentation` → POST `/api/searches`
2. `create_gts_ticket` → POST `/api/tickets`
3. `transfer_to_specialist` → POST `/api/transfers`
4. `activate_emergency_protocol` → POST `/api/emergencies`

Adicionalmente, las llamadas se pueden registrar en `/api/calls`.

---

## 🔧 Configuración del Agente

### Variables de Entorno del Agente

```bash
# URL de la API GTS Dashboard
GTS_API_URL=http://localhost:3000

# En producción, usar HTTPS
# GTS_API_URL=https://gts-dashboard.enagas.es
```

---

## 🛠️ Implementación de las Tools

### Tool 1: `search_gts_documentation`

Cuando el agente busca información en la documentación:

```python
import requests

def search_gts_documentation(query, tipo_proceso=None, usuario_solicitante=None):
    """
    Busca información en documentación técnica del GTS
    
    Args:
        query (str): Consulta de búsqueda
        tipo_proceso (str, optional): habilitacion, programacion, medicion, etc.
        usuario_solicitante (str, optional): Nombre del usuario que solicita
    """
    
    # Realizar búsqueda en tu sistema de documentación
    resultados = tu_sistema_buscar_docs(query, tipo_proceso)
    
    # Registrar la búsqueda en el dashboard
    try:
        response = requests.post(
            f"{GTS_API_URL}/api/searches",
            json={
                "query": query,
                "tipo_proceso": tipo_proceso,
                "usuario_solicitante": usuario_solicitante,
                "resultados_count": len(resultados),
                "documentos_encontrados": [
                    {
                        "titulo": doc.titulo,
                        "seccion": doc.seccion
                    }
                    for doc in resultados[:5]  # Top 5
                ]
            },
            timeout=5
        )
        response.raise_for_status()
    except Exception as e:
        # No bloquear el flujo del agente si falla el registro
        print(f"Error registrando búsqueda en dashboard: {e}")
    
    return resultados
```

**Ejemplo de uso en el agente:**
```python
# Durante una llamada
resultados = search_gts_documentation(
    query="habilitación punto suministro documentación",
    tipo_proceso="habilitacion",
    usuario_solicitante="Laura Gómez"
)

# Responder al usuario con los resultados...
```

---

### Tool 2: `create_gts_ticket`

Cuando el agente crea un ticket de incidencia:

```python
def create_gts_ticket(tipo, descripcion, contacto, **kwargs):
    """
    Crea un ticket de incidencia o consulta
    
    Args:
        tipo (str): INCIDENCIA_TECNICA, CONSULTA_ESPECIALIZADA, RECLAMACION
        descripcion (str): Descripción del problema
        contacto (dict): {"nombre": str, "empresa": str, "telefono": str, "email": str}
        **kwargs: usuario_afectado, sistema, prioridad, notas
    """
    
    # Determinar prioridad automáticamente si no se especifica
    prioridad = kwargs.get('prioridad', 'MEDIA')
    
    # Si es incidencia técnica crítica, subir prioridad
    if tipo == 'INCIDENCIA_TECNICA' and 'crítico' in descripcion.lower():
        prioridad = 'CRITICA'
    
    payload = {
        "tipo": tipo,
        "descripcion": descripcion,
        "contacto": contacto,
        "prioridad": prioridad,
        **kwargs
    }
    
    try:
        response = requests.post(
            f"{GTS_API_URL}/api/tickets",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        # Obtener el número de ticket generado
        numero_ticket = data['ticket']['numero_ticket']
        
        # Informar al usuario del número de ticket
        return {
            "success": True,
            "numero_ticket": numero_ticket,
            "mensaje": f"Ticket {numero_ticket} creado exitosamente"
        }
        
    except Exception as e:
        print(f"Error creando ticket: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

**Ejemplo de uso en el agente:**
```python
# Durante una llamada de incidencia
resultado = create_gts_ticket(
    tipo="INCIDENCIA_TECNICA",
    descripcion="Error de autenticación en SL-ATR desde ayer",
    usuario_afectado="jruiz_gasur",
    sistema="SL-ATR",
    contacto={
        "nombre": "Javier Ruiz",
        "empresa": "GasDistribución Sur",
        "telefono": "600123456",
        "email": "jruiz@gasdistribucion.es"
    },
    prioridad="ALTA",
    notas="Usuario intentó recuperar contraseña sin éxito"
)

if resultado['success']:
    # Responder: "He registrado su incidencia con el número {numero_ticket}"
    pass
```

---

### Tool 3: `transfer_to_specialist`

Cuando el agente transfiere una llamada:

```python
def transfer_to_specialist(area_destino, resumen_consulta, datos_usuario, ticket_id=None):
    """
    Registra una transferencia a especialista
    
    Args:
        area_destino (str): Área de destino (operaciones, medición, comercial, etc.)
        resumen_consulta (str): Resumen de la consulta
        datos_usuario (dict): Información del usuario
        ticket_id (str, optional): ID del ticket relacionado
    """
    
    payload = {
        "area_destino": area_destino,
        "resumen_consulta": resumen_consulta,
        "datos_usuario": datos_usuario,
        "ticket_id": ticket_id
    }
    
    try:
        response = requests.post(
            f"{GTS_API_URL}/api/transfers",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        return {
            "success": True,
            "transfer_id": data['transfer']['id']
        }
        
    except Exception as e:
        print(f"Error registrando transferencia: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

**Ejemplo de uso en el agente:**
```python
# Antes de transferir la llamada
transfer_to_specialist(
    area_destino="Operaciones - Capacidades",
    resumen_consulta="Consulta técnica sobre capacidad de inyección en Planta Huelva",
    datos_usuario={
        "nombre": "Laura Gómez",
        "empresa": "EnerPlus",
        "telefono": "600987654",
        "email": "laura.gomez@enerplus.es"
    }
)

# Proceder con la transferencia real de la llamada...
```

---

### Tool 4: `activate_emergency_protocol`

Cuando se detecta una emergencia:

```python
def activate_emergency_protocol(tipo_incidente, ubicacion_completa, 
                                contacto_llamante, descripcion_situacion, 
                                nivel_riesgo, **kwargs):
    """
    Activa protocolo de emergencia
    
    Args:
        tipo_incidente (str): FUGA, DAÑO_INFRAESTRUCTURA, OBRAS_NO_AUTORIZADAS, ANOMALIA_CRITICA
        ubicacion_completa (str): Ubicación detallada
        contacto_llamante (dict): {"nombre": str, "telefono": str, "empresa": str}
        descripcion_situacion (str): Descripción de la emergencia
        nivel_riesgo (str): BAJO, MEDIO, ALTO, CRITICO
        **kwargs: coordenadas, municipio, provincia
    """
    
    payload = {
        "tipo_incidente": tipo_incidente,
        "ubicacion_completa": ubicacion_completa,
        "contacto_llamante": contacto_llamante,
        "descripcion_situacion": descripcion_situacion,
        "nivel_riesgo": nivel_riesgo,
        **kwargs
    }
    
    try:
        response = requests.post(
            f"{GTS_API_URL}/api/emergencies",
            json=payload,
            timeout=10
        )
        response.raise_for_status()
        data = response.json()
        
        codigo_emergencia = data['emergency']['codigo_emergencia']
        tiempo_eta = data['tiempo_estimado_llegada']
        
        return {
            "success": True,
            "codigo_emergencia": codigo_emergencia,
            "tiempo_estimado_llegada": tiempo_eta,
            "mensaje": f"Protocolo activado: {codigo_emergencia}"
        }
        
    except Exception as e:
        # En emergencias, esto es crítico - hacer retry
        print(f"ERROR CRÍTICO activando emergencia: {e}")
        return {
            "success": False,
            "error": str(e)
        }
```

**Ejemplo de uso en el agente:**
```python
# Al detectar una emergencia durante la llamada
resultado = activate_emergency_protocol(
    tipo_incidente="FUGA",
    ubicacion_completa="Polígono Industrial Las Américas, Getafe, calle Industria 5-7",
    contacto_llamante={
        "nombre": "Antonio Fernández",
        "telefono": "655432109",
        "empresa": "Gestión de Polígonos"
    },
    descripcion_situacion="Olor intenso a gas. Personal evacuado.",
    nivel_riesgo="MEDIO",
    municipio="Getafe",
    provincia="Madrid"
)

if resultado['success']:
    # Informar al usuario:
    # "He activado el protocolo con código {codigo_emergencia}.
    #  Equipo técnico llegará en aproximadamente {tiempo_estimado_llegada}."
    pass
```

---

## 📞 Registro de Llamadas (Opcional pero Recomendado)

### Inicio de llamada

```python
def on_call_started(nombre_llamante, empresa, telefono, tipo_consulta):
    """
    Registra el inicio de una llamada
    """
    try:
        response = requests.post(
            f"{GTS_API_URL}/api/calls",
            json={
                "nombre_llamante": nombre_llamante,
                "empresa": empresa,
                "telefono": telefono,
                "tipo_consulta": tipo_consulta,  # EMERGENCIA, INCIDENCIA, CONSULTA_OPERATIVA, CONSULTA_ADMINISTRATIVA
                "notas": "Llamada iniciada"
            },
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        return data['call']['id']  # Guardar para finalizar después
    except Exception as e:
        print(f"Error registrando inicio de llamada: {e}")
        return None
```

### Fin de llamada

```python
def on_call_ended(call_id, duracion_segundos, resolucion, notas):
    """
    Registra el fin de una llamada
    """
    if not call_id:
        return
        
    try:
        response = requests.patch(
            f"{GTS_API_URL}/api/calls/{call_id}/end",
            json={
                "duracion_segundos": duracion_segundos,
                "resolucion": resolucion,
                "notas": notas
            },
            timeout=5
        )
        response.raise_for_status()
    except Exception as e:
        print(f"Error registrando fin de llamada: {e}")
```

---

## 🔄 Flujo Completo de una Llamada

```python
class GTSCallHandler:
    def __init__(self):
        self.call_id = None
        self.call_start_time = None
    
    def handle_call(self, llamante_info):
        """Maneja una llamada completa"""
        
        # 1. Registrar inicio de llamada
        self.call_start_time = time.time()
        self.call_id = on_call_started(
            nombre_llamante=llamante_info['nombre'],
            empresa=llamante_info['empresa'],
            telefono=llamante_info['telefono'],
            tipo_consulta="CONSULTA_OPERATIVA"  # Ajustar según sea necesario
        )
        
        # 2. Procesar la llamada con el agente
        # ... (lógica del agente de voz)
        
        # 3. Si el usuario necesita buscar info
        resultados = search_gts_documentation(
            query="habilitación punto suministro",
            usuario_solicitante=llamante_info['nombre']
        )
        
        # 4. Si es una incidencia, crear ticket
        if es_incidencia:
            ticket_result = create_gts_ticket(
                tipo="INCIDENCIA_TECNICA",
                descripcion="...",
                contacto=llamante_info,
                prioridad="ALTA"
            )
        
        # 5. Si es emergencia, activar protocolo
        if es_emergencia:
            emergency_result = activate_emergency_protocol(
                tipo_incidente="FUGA",
                ubicacion_completa="...",
                contacto_llamante=llamante_info,
                descripcion_situacion="...",
                nivel_riesgo="MEDIO"
            )
        
        # 6. Si requiere especialista, registrar transferencia
        if requiere_transferencia:
            transfer_result = transfer_to_specialist(
                area_destino="Operaciones",
                resumen_consulta="...",
                datos_usuario=llamante_info
            )
        
        # 7. Finalizar llamada
        duracion = int(time.time() - self.call_start_time)
        on_call_ended(
            call_id=self.call_id,
            duracion_segundos=duracion,
            resolucion="Consulta resuelta satisfactoriamente",
            notas="Usuario informado correctamente"
        )
```

---

## ⚠️ Manejo de Errores

### Estrategia de Retry para Emergencias

```python
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
def activate_emergency_protocol_with_retry(*args, **kwargs):
    """
    Activa emergencia con reintentos automáticos
    Crítico: no puede fallar
    """
    return activate_emergency_protocol(*args, **kwargs)
```

### Logging

```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def safe_api_call(func):
    """Decorator para llamadas seguras a la API"""
    def wrapper(*args, **kwargs):
        try:
            result = func(*args, **kwargs)
            logger.info(f"{func.__name__} exitoso")
            return result
        except Exception as e:
            logger.error(f"Error en {func.__name__}: {e}")
            # No bloquear el flujo del agente
            return {"success": False, "error": str(e)}
    return wrapper

@safe_api_call
def create_gts_ticket(*args, **kwargs):
    # ... implementación
    pass
```

---

## 🧪 Testing

### Script de prueba para el agente

```python
import requests

API_URL = "http://localhost:3000"

def test_integration():
    """Prueba todas las integraciones"""
    
    print("🧪 Probando integración del agente...")
    
    # Test 1: Búsqueda
    print("\n1. Búsqueda en documentación...")
    resp = requests.post(f"{API_URL}/api/searches", json={
        "query": "test query",
        "tipo_proceso": "programacion"
    })
    assert resp.status_code == 201
    print("✅ Búsqueda OK")
    
    # Test 2: Crear ticket
    print("\n2. Crear ticket...")
    resp = requests.post(f"{API_URL}/api/tickets", json={
        "tipo": "INCIDENCIA_TECNICA",
        "descripcion": "Test ticket",
        "contacto": {"nombre": "Test", "email": "test@test.com"},
        "prioridad": "MEDIA"
    })
    assert resp.status_code == 201
    print("✅ Ticket OK")
    
    # Test 3: Emergencia
    print("\n3. Activar emergencia...")
    resp = requests.post(f"{API_URL}/api/emergencies", json={
        "tipo_incidente": "FUGA",
        "ubicacion_completa": "Test location",
        "contacto_llamante": {"nombre": "Test", "telefono": "600000000"},
        "descripcion_situacion": "Test",
        "nivel_riesgo": "BAJO"
    })
    assert resp.status_code == 201
    print("✅ Emergencia OK")
    
    # Test 4: Transferencia
    print("\n4. Transferencia...")
    resp = requests.post(f"{API_URL}/api/transfers", json={
        "area_destino": "Test Area",
        "resumen_consulta": "Test",
        "datos_usuario": {"nombre": "Test"}
    })
    assert resp.status_code == 201
    print("✅ Transferencia OK")
    
    print("\n✅ Todas las pruebas pasaron!")

if __name__ == "__main__":
    test_integration()
```

---

## 📊 Monitoreo desde el Agente

### Verificar que la API está disponible

```python
def check_dashboard_health():
    """Verifica que el dashboard está operativo"""
    try:
        response = requests.get(f"{GTS_API_URL}/health", timeout=2)
        return response.status_code == 200
    except:
        return False

# Al inicio del agente
if not check_dashboard_health():
    logger.warning("Dashboard GTS no disponible - datos no se sincronizarán")
else:
    logger.info("Dashboard GTS conectado correctamente")
```

---

## 🔐 Producción

### Headers de Autenticación (para implementar)

```python
import os

API_KEY = os.getenv('GTS_API_KEY')

headers = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {API_KEY}'  # Implementar en backend
}

response = requests.post(
    f"{GTS_API_URL}/api/tickets",
    json=payload,
    headers=headers
)
```

---

## 📞 Contacto y Soporte

Para dudas sobre la integración, contacta al equipo de desarrollo del dashboard GTS.

---

¡Integración lista! El agente de voz ahora puede visualizar todas sus operaciones en tiempo real en el dashboard. 🚀
