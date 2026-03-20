/**
 * Cliente HTTP para comunicarse con artists-service
 */

const ARTISTS_SERVICE_URL =
  process.env.ARTISTS_SERVICE_URL || "http://localhost:4001";
const SERVICE_TOKEN = process.env.JWT_SECRET;

export class ArtistsClient {
  private baseUrl: string;
  private serviceToken: string;

  constructor() {
    this.baseUrl = ARTISTS_SERVICE_URL;
    this.serviceToken = SERVICE_TOKEN || "";
  }

  /**
   * Obtener información de un artista
   */
  async getArtist(artistId: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/artists/${artistId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.serviceToken}`,
        },
      });

      if (!response.ok) {
        console.error(
          "[ArtistsClient] Error obteniendo artista:",
          await response.text()
        );
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error(
        "[ArtistsClient] Error de conexión con artists-service:",
        error
      );
      return null;
    }
  }

  /**
   * Obtener cuenta de Stripe Connect del artista
   */
  async getStripeConnectAccount(artistId: string): Promise<{
    stripeAccountId: string | null;
    isConnected: boolean;
    canReceivePayouts: boolean;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/artists/${artistId}/stripe-account`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${this.serviceToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "[ArtistsClient] Error obteniendo cuenta Stripe:",
          await response.text()
        );
        return null;
      }

      return (await response.json()) as {
        stripeAccountId: string | null;
        isConnected: boolean;
        canReceivePayouts: boolean;
      };
    } catch (error) {
      console.error(
        "[ArtistsClient] Error de conexión con artists-service:",
        error
      );
      return null;
    }
  }

  /**
   * Validar que el artista existe y está activo
   */
  async validateArtist(artistId: string): Promise<boolean> {
    const artist = await this.getArtist(artistId);
    return artist !== null && artist.active === true;
  }
}

// Exportar instancia singleton
export const artistsClient = new ArtistsClient();
